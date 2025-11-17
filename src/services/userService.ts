import api from './api';

export interface Address {
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  bio?: string;
  avatar?: string | null;
  address?: Address;
  role: string;
  twoFactorEnabled: boolean;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  address?: Address;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  username?: string;
  avatar?: string | null;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  name?: string;
  role?: string;
}

class UserService {
  // Obtener perfil del usuario actual
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await api.get<{ success: boolean; data: { user: UserProfile } }>(
        '/users/me'
      );
      if (response.data.success) {
        return response.data.data.user;
      }
      throw new Error('Failed to get profile');
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Actualizar perfil
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    try {
      const response = await api.put<{ success: boolean; data: { user: UserProfile } }>(
        '/users/me',
        data
      );
      if (response.data.success) {
        return response.data.data.user;
      }
      throw new Error('Failed to update profile');
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Cambiar contraseña
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      const response = await api.put<{ success: boolean; message: string }>(
        '/users/me/password',
        data
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Obtener todos los usuarios
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await api.get<{ success: boolean; data: { users: User[] } }>(
        '/users'
      );
      if (response.data.success) {
        return response.data.data.users;
      }
      throw new Error('Failed to get users');
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Crear nuevo usuario
  async createUser(data: CreateUserData): Promise<User> {
    try {
      const response = await api.post<{ success: boolean; data: { user: User }; message: string }>(
        '/users',
        data
      );
      if (response.data.success) {
        return response.data.data.user;
      }
      throw new Error(response.data.message || 'Failed to create user');
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Actualizar usuario
  async updateUser(id: string, data: { name?: string; email?: string; password?: string; role?: string }): Promise<User> {
    try {
      const response = await api.put<{ success: boolean; data: { user: User }; message: string }>(
        `/users/${id}`,
        data
      );
      if (response.data.success) {
        return response.data.data.user;
      }
      throw new Error(response.data.message || 'Failed to update user');
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Cambiar estado del usuario (activar/desactivar)
  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    try {
      const response = await api.put<{ success: boolean; data: { user: User }; message: string }>(
        `/users/${id}/status`,
        { isActive }
      );
      if (response.data.success) {
        return response.data.data.user;
      }
      throw new Error(response.data.message || 'Failed to update user status');
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Eliminar usuario
  async deleteUser(id: string): Promise<void> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/users/${id}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete user');
      }
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Manejar errores
  private handleError(error: unknown): Error {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      const message = axiosError.response?.data?.message || 'Request error';
      const errorObj = new Error(message) as Error & { status?: number; data?: { message?: string } };
      errorObj.status = axiosError.response?.status;
      errorObj.data = axiosError.response?.data;
      return errorObj;
    } else if (error && typeof error === 'object' && 'request' in error) {
      return new Error('No response received from server');
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Error(errorMessage);
    }
  }
}

export default new UserService();

