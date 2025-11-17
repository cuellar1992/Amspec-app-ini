import {
  startRegistration,
  startAuthentication,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import api from './api';

export interface Passkey {
  id: string;
  name: string;
  deviceType: string;
  createdAt: string;
  lastUsed: string | null;
  transports: string[];
}

export interface PasskeyRegistrationOptions {
  options: PublicKeyCredentialCreationOptionsJSON;
}

export interface PasskeyAuthenticationOptions {
  options: PublicKeyCredentialRequestOptionsJSON;
  challenge: string;
}

class PasskeyService {
  // Get registration options from server
  async getRegisterOptions(): Promise<PublicKeyCredentialCreationOptionsJSON> {
    try {
      const response = await api.post<{ success: boolean; data: PublicKeyCredentialCreationOptionsJSON }>(
        '/auth/passkey/register-options'
      );

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to get registration options');
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Register a new passkey
  async registerPasskey(name: string): Promise<Passkey> {
    try {
      // Check if WebAuthn is supported
      if (!this.isSupported()) {
        throw new Error('Passkeys are not supported on this device/browser');
      }

      // Get registration options from server
      const options = await this.getRegisterOptions();

      // Validar que las opciones tengan la estructura correcta
      if (!options || !options.challenge) {
        throw new Error('Invalid registration options received from server');
      }

      // Start registration ceremony
      const credential = await startRegistration({ optionsJSON: options });

      // Verify registration with server
      const response = await api.post<{ success: boolean; message: string; data: Passkey }>(
        '/auth/passkey/register-verify',
        { credential, name }
      );

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to register passkey');
    } catch (error: unknown) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.name === 'NotAllowedError') {
        throw new Error('Passkey registration was cancelled');
      }
      throw this.handleError(error);
    }
  }

  // Get authentication options from server
  async getLoginOptions(email?: string): Promise<PasskeyAuthenticationOptions> {
    try {
      const response = await api.post<{ success: boolean; data: PasskeyAuthenticationOptions }>(
        '/auth/passkey/login-options',
        { email }
      );

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to get login options');
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Authenticate with passkey
  async authenticateWithPasskey(email?: string): Promise<{
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
  }> {
    try {
      // Check if WebAuthn is supported
      if (!this.isSupported()) {
        throw new Error('Passkeys are not supported on this device/browser');
      }

      // Get authentication options from server
      const { options, challenge } = await this.getLoginOptions(email);

      // Start authentication ceremony
      const credential = await startAuthentication({ optionsJSON: options });

      // Verify authentication with server
      const response = await api.post<{
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
      }>('/auth/passkey/login-verify', { credential, challenge });

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to authenticate with passkey');
    } catch (error: unknown) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.name === 'NotAllowedError') {
        throw new Error('Passkey authentication was cancelled');
      }
      throw this.handleError(error);
    }
  }

  // List user's passkeys
  async listPasskeys(): Promise<Passkey[]> {
    try {
      const response = await api.get<{ success: boolean; data: { passkeys: Passkey[] } }>(
        '/auth/passkey/list'
      );

      if (response.data.success) {
        return response.data.data.passkeys;
      }

      throw new Error('Failed to list passkeys');
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Delete a passkey
  async deletePasskey(id: string): Promise<void> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/auth/passkey/${id}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete passkey');
      }
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Check if WebAuthn is supported
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential === 'function'
    );
  }

  // Check if platform authenticator is available (TouchID, FaceID, Windows Hello)
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  // Handle errors
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

export default new PasskeyService();
