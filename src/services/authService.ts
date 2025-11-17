import api from './api';
import { ref, type Ref } from 'vue';

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      avatar?: string | null;
      role: string;
      twoFactorEnabled: boolean;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface LoginResponseWithPasswordChange {
  success: boolean;
  requirePasswordChange: true;
  tempToken: string;
  message: string;
}

export interface LoginResponseWith2FA {
  success: boolean;
  requires2FA: true;
  tempToken: string;
  message: string;
}

export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: string;
  twoFactorEnabled: boolean;
}

class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';

  // Estado reactivo del usuario
  private currentUserRef: Ref<User | null> = ref(null);

  constructor() {
    // Inicializar el estado reactivo desde localStorage
    this.loadUserFromStorage();
  }

  // Cargar usuario desde localStorage al inicializar
  private loadUserFromStorage() {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        this.currentUserRef.value = JSON.parse(userStr);
      } catch {
        this.currentUserRef.value = null;
      }
    }
  }

  // Guardar tokens en localStorage
  private saveTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  // Guardar usuario en localStorage y actualizar estado reactivo
  private saveUser(user: User) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserRef.value = user;
  }

  // Obtener access token
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // Obtener refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Obtener usuario actual (reactivo)
  getCurrentUser(): User | null {
    return this.currentUserRef.value;
  }

  // Obtener el ref del usuario actual para reactividad
  getCurrentUserRef(): Ref<User | null> {
    return this.currentUserRef;
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    try {
      return !!this.getAccessToken();
    } catch (error) {
      console.warn('Error verifying authentication:', error);
      return false;
    }
  }

  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse | LoginResponseWithPasswordChange | LoginResponseWith2FA> {
    try {
      const response = await api.post<AuthResponse | LoginResponseWithPasswordChange | LoginResponseWith2FA>('/auth/login', credentials);

      if (response.data.success) {
        // Si requiere cambio de contraseña, devolver la respuesta con requirePasswordChange
        if ('requirePasswordChange' in response.data && response.data.requirePasswordChange) {
          return response.data as LoginResponseWithPasswordChange;
        }

        // Si requiere 2FA, devolver la respuesta con requires2FA
        if ('requires2FA' in response.data && response.data.requires2FA) {
          return response.data as LoginResponseWith2FA;
        }

        // Verificar que data tiene tokens y user antes de desestructurar
        if ('data' in response.data && response.data.data?.tokens && response.data.data?.user) {
          const { tokens, user } = response.data.data;
          this.saveTokens(tokens.accessToken, tokens.refreshToken);
          this.saveUser(user);
        }
      }

      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Verificar código 2FA
  async verify2FA(tempToken: string, twoFactorCode: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/verify-2fa', {
        tempToken,
        twoFactorCode,
      });

      if (response.data.success && response.data.data?.tokens && response.data.data?.user) {
        const { tokens, user } = response.data.data;

        if (import.meta.env.DEV) {
          console.log('📝 Guardando usuario después de 2FA:', user);
        }

        this.saveTokens(tokens.accessToken, tokens.refreshToken);
        this.saveUser(user);

        if (import.meta.env.DEV) {
          console.log('✅ Usuario guardado. Estado actual:', this.currentUserRef.value);
        }
      }

      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Registro
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);

      if (response.data.success && response.data.data?.tokens && response.data.data?.user) {
        const { tokens, user } = response.data.data;
        this.saveTokens(tokens.accessToken, tokens.refreshToken);
        this.saveUser(user);
      }

      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Limpiar tokens y usuario independientemente del resultado
      this.clearAuth();
    }
  }

  // Refrescar access token
  async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<{ success: boolean; data: { accessToken: string } }>(
        '/auth/refresh',
        { refreshToken }
      );

      if (response.data.success && response.data.data.accessToken) {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.data.data.accessToken);
        return response.data.data.accessToken;
      }

      return null;
    } catch (error) {
      // Si el refresh falla, limpiar todo
      this.clearAuth();
      throw error;
    }
  }

  // Obtener información del usuario actual
  async getMe(): Promise<User> {
    try {
      const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
      if (response.data.success) {
        this.saveUser(response.data.data.user);
        return response.data.data.user;
      }
      throw new Error('Failed to get user information');
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Habilitar 2FA
  async enable2FA(): Promise<{ qrCode: string; secret: string; manualEntryKey: string }> {
    try {
      const response = await api.post<{
        success: boolean;
        data: { qrCode: string; secret: string; manualEntryKey: string };
      }>('/auth/enable-2fa');

      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to enable 2FA');
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Confirmar 2FA
  async confirm2FA(twoFactorCode: string): Promise<void> {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        '/auth/confirm-2fa',
        { twoFactorCode }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to confirm 2FA');
      }
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Deshabilitar 2FA
  async disable2FA(password: string, twoFactorCode?: string): Promise<void> {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        '/auth/disable-2fa',
        { password, twoFactorCode }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to disable 2FA');
      }
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Cambiar contraseña en primer login
  async firstPasswordChange(
    tempToken: string,
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/first-password-change', {
        tempToken,
        currentPassword,
        newPassword,
      });

      if (response.data.success && response.data.data?.tokens && response.data.data?.user) {
        const { tokens, user } = response.data.data;
        this.saveTokens(tokens.accessToken, tokens.refreshToken);
        this.saveUser(user);
      }

      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Limpiar autenticación
  clearAuth(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserRef.value = null;
  }

  // Manejar errores
  private handleError(error: unknown): Error {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Request error';
      const errorObj = new Error(message);
      (errorObj as ApiError).status = axiosError.response?.status;
      (errorObj as ApiError).data = axiosError.response?.data;
      return errorObj;
    } else if (error && typeof error === 'object' && 'request' in error) {
      return new Error('No response received from server');
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Error(errorMessage);
    }
  }
}

export default new AuthService();
