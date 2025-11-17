import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Generar secreto 2FA para un usuario
export const generate2FASecret = async (userEmail) => {
  const secret = speakeasy.generateSecret({
    name: `AmSpec App (${userEmail})`,
    issuer: 'AmSpec App',
  });

  return {
    secret: secret.base32,
    otpAuthUrl: secret.otpauth_url,
  };
};

// Generar QR code para 2FA
export const generateQRCode = async (otpAuthUrl) => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    throw new Error('Error generando QR code: ' + error.message);
  }
};

// Verificar código 2FA
export const verify2FAToken = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Permitir tokens ±2 períodos de tiempo (60 segundos cada uno)
  });
};

