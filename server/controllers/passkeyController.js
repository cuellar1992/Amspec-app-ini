import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import Passkey from '../models/Passkey.js';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

// Configuration
const RP_NAME = 'AmSpec App';

// En producción, obtener el dominio desde la URL del request
// En desarrollo, usar localhost
const getRP_ID = (req) => {
  if (process.env.RP_ID) {
    return process.env.RP_ID;
  }
  if (process.env.NODE_ENV === 'production') {
    // Extraer el hostname del request en producción
    return req?.get('host')?.split(':')[0] || 'ghost-app-oo46l.ondigitalocean.app';
  }
  return 'localhost';
};

const getORIGIN = (req) => {
  if (process.env.ORIGIN) {
    return process.env.ORIGIN;
  }
  if (process.env.NODE_ENV === 'production') {
    // Construir la URL completa basada en el request
    const protocol = req?.get('x-forwarded-proto') || req?.protocol || 'https';
    const host = req?.get('host') || 'ghost-app-oo46l.ondigitalocean.app';
    return `${protocol}://${host}`;
  }
  return 'http://localhost:5173';
};

// @desc    Generate registration options for a new passkey
// @route   POST /api/auth/passkey/register-options
// @access  Private
export const generateRegisterOptions = async (req, res) => {
  try {
    const RP_ID = getRP_ID(req);
    const ORIGIN = getORIGIN(req);

    console.log('🔐 Passkey registration - RP_ID:', RP_ID, 'ORIGIN:', ORIGIN);

    // Incluir currentChallenge explícitamente para poder guardarlo después
    const user = await User.findById(req.user._id).select('+currentChallenge');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Validar que el usuario tenga email y name
    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: 'User email is required for passkey registration',
      });
    }

    // Get existing passkeys for this user
    const userPasskeys = await Passkey.find({ user: user._id });

    // Convert credentialID Buffer to base64url for excludeCredentials
    const excludeCredentials = userPasskeys.map((passkey) => {
      let credentialID;
      if (Buffer.isBuffer(passkey.credentialID)) {
        credentialID = passkey.credentialID;
      } else if (typeof passkey.credentialID === 'string') {
        credentialID = Buffer.from(passkey.credentialID, 'base64');
      } else {
        console.warn('⚠️ Invalid credentialID format for passkey:', passkey._id);
        return null;
      }

      return {
        id: credentialID,
        type: 'public-key',
        transports: passkey.transports || [],
      };
    }).filter(Boolean); // Remove null entries

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: Buffer.from(user._id.toString(), 'utf8'), // Convert to Buffer
      userName: user.email,
      userDisplayName: user.name || user.email,
      // Don't prompt users for additional information
      attestationType: 'none',
      // Prevent re-registration of existing authenticators
      excludeCredentials,
      authenticatorSelection: {
        // Allow both platform (TouchID, FaceID, Windows Hello) and cross-platform (portable) authenticators
        // This allows registering passkeys from iPhone that can be synced via iCloud Keychain
        // undefined = allow both platform and cross-platform authenticators
        authenticatorAttachment: undefined,
        // Require resident key for syncing across devices (iCloud Keychain, etc.)
        requireResidentKey: true,
        residentKey: 'preferred', // preferred allows more flexibility than required
        userVerification: 'preferred', // preferred instead of required for better compatibility
      },
    });

    // Store challenge in session/database temporarily
    // For simplicity, we'll store it in the user document
    user.currentChallenge = options.challenge;
    await user.save();

    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('Error generating registration options:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      RP_ID,
      ORIGIN,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate registration options',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Verify passkey registration
// @route   POST /api/auth/passkey/register-verify
// @access  Private
export const verifyRegistration = async (req, res) => {
  try {
    const RP_ID = getRP_ID(req);
    const ORIGIN = getORIGIN(req);

    const { credential, name } = req.body;

    if (!credential || !name) {
      return res.status(400).json({
        success: false,
        message: 'Credential and name are required',
      });
    }

    console.log('Received credential structure:', {
      hasId: !!credential.id,
      hasRawId: !!credential.rawId,
      hasResponse: !!credential.response,
      credentialKeys: Object.keys(credential),
    });

    // Incluir currentChallenge explícitamente ya que tiene select: false
    const user = await User.findById(req.user._id).select('+currentChallenge');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.currentChallenge) {
      return res.status(400).json({
        success: false,
        message: 'No registration in progress. Please start the registration process again.',
      });
    }

    const expectedChallenge = user.currentChallenge;

    // Verify the registration response
    // Nota: Cuando attestationType es 'none', registrationInfo puede estar presente pero limitado
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
      // Permitir verificación sin conocer el authenticator previo (primera vez)
      requireCounter: false,
      // Permitir attestation 'none' (ya que lo configuramos así en registration)
      allowUnsafeAuthenticatorAttachment: false,
    });

    const { verified, registrationInfo } = verification;
    
    console.log('Verification result:', {
      verified,
      hasRegistrationInfo: !!registrationInfo,
      registrationInfoKeys: registrationInfo ? Object.keys(registrationInfo) : null,
    });

    if (!verified) {
      console.error('Verification failed:', verification);
      return res.status(400).json({
        success: false,
        message: 'Passkey verification failed',
      });
    }

    if (!registrationInfo) {
      console.error('Verification succeeded but registrationInfo is missing');
      console.error('Full verification object:', JSON.stringify(verification, null, 2));
      return res.status(500).json({
        success: false,
        message: 'Passkey verification succeeded but registration info is missing',
      });
    }

    console.log('Registration info received:', {
      hasCredentialID: !!registrationInfo.credentialID,
      hasCredentialPublicKey: !!registrationInfo.credentialPublicKey,
      hasCredentialObject: !!registrationInfo.credential,
      credentialIDType: typeof registrationInfo.credentialID,
      credentialPublicKeyType: typeof registrationInfo.credentialPublicKey,
      keys: Object.keys(registrationInfo),
      credentialKeys: registrationInfo.credential ? Object.keys(registrationInfo.credential) : null,
      credentialStructure: registrationInfo.credential ? {
        hasId: !!registrationInfo.credential.id,
        hasPublicKey: !!registrationInfo.credential.publicKey,
        credentialKeys: Object.keys(registrationInfo.credential),
      } : null,
    });

    // Extraer credentialID y credentialPublicKey
    // En simplewebauthn v13+, la estructura es: registrationInfo.credential.id y registrationInfo.credential.publicKey
    let credentialID = null;
    let credentialPublicKey = null;
    
    // Intentar obtener de registrationInfo.credential (estructura v13+)
    if (registrationInfo?.credential) {
      credentialID = registrationInfo.credential.id;
      credentialPublicKey = registrationInfo.credential.publicKey;
    }
    
    // Fallback: buscar directamente en registrationInfo (estructura antigua)
    if (!credentialID) {
      credentialID = registrationInfo?.credentialID;
    }
    
    if (!credentialPublicKey) {
      credentialPublicKey = registrationInfo?.credentialPublicKey;
    }
    
    // Si aún no están, obtenerlos de credential (respuesta del navegador)
    if (!credentialID) {
      if (credential.rawId) {
        // rawId viene como ArrayBuffer o Uint8Array
        if (credential.rawId instanceof ArrayBuffer) {
          credentialID = Buffer.from(credential.rawId);
        } else if (credential.rawId instanceof Uint8Array) {
          credentialID = Buffer.from(credential.rawId);
        } else {
          credentialID = Buffer.from(credential.rawId);
        }
      } else if (credential.id) {
        // credential.id viene en base64url string
        try {
          credentialID = Buffer.from(credential.id, 'base64url');
        } catch (e) {
          console.error('Error converting credential.id to Buffer:', e);
          // Intentar base64 como fallback
          try {
            credentialID = Buffer.from(credential.id, 'base64');
          } catch (e2) {
            console.error('Error converting credential.id with base64:', e2);
          }
        }
      }
    }
    
    if (!credentialPublicKey) {
      console.error('credentialPublicKey missing from registrationInfo');
      console.error('RegistrationInfo structure:', JSON.stringify(registrationInfo, null, 2));
      // Intentar obtener de credential.response si está disponible (fallback)
      if (credential.response?.publicKey) {
        console.warn('Using publicKey from credential.response (fallback)');
        credentialPublicKey = credential.response.publicKey;
      }
    }

    // Validar que credentialID y credentialPublicKey existan
    if (!credentialID) {
      console.error('credentialID is missing. RegistrationInfo:', registrationInfo);
      console.error('Credential object:', credential);
      return res.status(500).json({
        success: false,
        message: 'Credential ID is missing from registration response',
      });
    }

    if (!credentialPublicKey) {
      console.error('credentialPublicKey is missing. RegistrationInfo:', registrationInfo);
      console.error('Credential object:', credential);
      return res.status(500).json({
        success: false,
        message: 'Credential public key is missing from registration response',
      });
    }

    const {
      counter,
      credentialDeviceType,
      credentialBackedUp,
      aaguid,
    } = registrationInfo || {};

    // Convert credentialID a Buffer
    // credentialID puede venir como Uint8Array, Buffer, o string (base64/base64url)
    let credentialIDBuffer;
    if (Buffer.isBuffer(credentialID)) {
      credentialIDBuffer = credentialID;
    } else if (credentialID instanceof Uint8Array) {
      credentialIDBuffer = Buffer.from(credentialID);
    } else if (typeof credentialID === 'string') {
      // Intentar base64url primero (formato estándar de WebAuthn)
      try {
        credentialIDBuffer = Buffer.from(credentialID, 'base64url');
      } catch (e) {
        // Si falla, intentar base64
        try {
          credentialIDBuffer = Buffer.from(credentialID, 'base64');
        } catch (e2) {
          // Si ambos fallan, intentar como utf8
          credentialIDBuffer = Buffer.from(credentialID, 'utf8');
        }
      }
    } else if (credentialID instanceof ArrayBuffer) {
      credentialIDBuffer = Buffer.from(credentialID);
    } else {
      credentialIDBuffer = Buffer.from(credentialID);
    }

    // Convert credentialPublicKey a Buffer
    // credentialPublicKey normalmente viene como Buffer de registrationInfo.credential.publicKey
    let credentialPublicKeyBuffer;
    if (Buffer.isBuffer(credentialPublicKey)) {
      credentialPublicKeyBuffer = credentialPublicKey;
    } else if (credentialPublicKey instanceof Uint8Array) {
      credentialPublicKeyBuffer = Buffer.from(credentialPublicKey);
    } else if (credentialPublicKey instanceof ArrayBuffer) {
      credentialPublicKeyBuffer = Buffer.from(credentialPublicKey);
    } else if (typeof credentialPublicKey === 'string') {
      credentialPublicKeyBuffer = Buffer.from(credentialPublicKey, 'base64');
    } else {
      credentialPublicKeyBuffer = Buffer.from(credentialPublicKey);
    }

    // Mapear credentialDeviceType a valores válidos del enum
    let deviceType = 'unknown';
    if (credentialDeviceType) {
      // simplewebauthn puede devolver 'multiDevice' o 'singleDevice'
      if (credentialDeviceType === 'multiDevice' || credentialDeviceType === 'singleDevice') {
        deviceType = credentialDeviceType;
      } else if (credentialDeviceType === 'platform') {
        deviceType = 'platform';
      } else if (credentialDeviceType === 'cross-platform') {
        deviceType = 'cross-platform';
      }
    }

    // Save the passkey
    const passkey = await Passkey.create({
      user: user._id,
      credentialID: credentialIDBuffer,
      credentialPublicKey: credentialPublicKeyBuffer,
      counter: counter || 0,
      transports: credential.response?.transports || [],
      name: name.trim(),
      deviceType: deviceType,
      aaguid: aaguid || null,
    });

    // Clear the challenge
    user.currentChallenge = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Passkey registered successfully',
      data: {
        id: passkey._id,
        name: passkey.name,
        deviceType: passkey.deviceType,
        createdAt: passkey.createdAt,
      },
    });
  } catch (error) {
    console.error('Error verifying registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify passkey registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Generate authentication options for passkey login
// @route   POST /api/auth/passkey/login-options
// @access  Public
export const generateLoginOptions = async (req, res) => {
  try {
    const RP_ID = getRP_ID(req);

    const { email } = req.body;

    let allowCredentials = undefined;

    // If email provided, only allow passkeys for that user
    if (email) {
      const user = await User.findOne({ email });
      if (user) {
        const userPasskeys = await Passkey.find({ user: user._id });
        allowCredentials = userPasskeys.map((passkey) => ({
          id: passkey.credentialID,
          type: 'public-key',
          transports: passkey.transports,
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials,
      userVerification: 'required',
    });

    // Store challenge temporarily
    // In production, use Redis or session storage
    // For now, we'll send it back and expect it in the verify request
    res.json({
      success: true,
      data: {
        options,
        challenge: options.challenge, // Send challenge to client
      },
    });
  } catch (error) {
    console.error('Error generating login options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate login options',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Verify passkey authentication and login
// @route   POST /api/auth/passkey/login-verify
// @access  Public
export const verifyAuthentication = async (req, res) => {
  try {
    const RP_ID = getRP_ID(req);
    const ORIGIN = getORIGIN(req);

    console.log('🔐 Passkey login - RP_ID:', RP_ID, 'ORIGIN:', ORIGIN);

    const { credential, challenge } = req.body;

    if (!credential || !challenge) {
      return res.status(400).json({
        success: false,
        message: 'Credential and challenge are required',
      });
    }

    // Find the passkey by credential ID
    // credential.rawId viene como base64url string desde el navegador
    let credentialIDBuffer;
    try {
      if (typeof credential.rawId === 'string') {
        // Intentar base64url primero (formato estándar)
        try {
          credentialIDBuffer = Buffer.from(credential.rawId, 'base64url');
        } catch (e) {
          // Si falla, intentar base64
          credentialIDBuffer = Buffer.from(credential.rawId, 'base64');
        }
      } else if (credential.rawId instanceof ArrayBuffer) {
        credentialIDBuffer = Buffer.from(credential.rawId);
      } else if (credential.rawId instanceof Uint8Array) {
        credentialIDBuffer = Buffer.from(credential.rawId);
      } else {
        credentialIDBuffer = Buffer.from(credential.rawId);
      }
    } catch (error) {
      console.error('Error converting credential.rawId:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid credential ID format',
      });
    }

    // Buscar el passkey por credentialID
    // MongoDB puede tener problemas comparando Buffers directamente, así que buscamos todos los passkeys
    // y comparamos manualmente usando Buffer.equals()
    // Primero intentamos búsqueda directa (más eficiente)
    let passkey = await Passkey.findOne({ 
      credentialID: credentialIDBuffer 
    }).populate('user');

    // Si no se encontró, buscar manualmente comparando Buffers
    if (!passkey) {
      // Intentar búsqueda por userHandle si está disponible
      if (credential.response?.userHandle) {
        try {
          const userHandleEmail = Buffer.from(credential.response.userHandle, 'base64url').toString('utf8');
          const userByHandle = await User.findOne({ email: userHandleEmail });
          if (userByHandle) {
            const userPasskeys = await Passkey.find({ user: userByHandle._id }).populate('user');
            for (const pk of userPasskeys) {
              if (pk.credentialID && Buffer.isBuffer(pk.credentialID)) {
                if (pk.credentialID.equals(credentialIDBuffer)) {
                  passkey = pk;
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.error('Error searching by userHandle:', e);
        }
      }
      
      // Si aún no se encontró, buscar en todos los passkeys (último recurso)
      if (!passkey) {
        const allPasskeys = await Passkey.find().populate('user');
        for (const pk of allPasskeys) {
          if (pk.credentialID && Buffer.isBuffer(pk.credentialID)) {
            if (pk.credentialID.equals(credentialIDBuffer)) {
              passkey = pk;
              break;
            }
          }
        }
      }
    }

    if (!passkey) {
      console.error('Passkey not found for credentialID:', credentialIDBuffer.toString('base64'));
      return res.status(400).json({
        success: false,
        message: 'Passkey not found',
      });
    }

    const user = passkey.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User associated with passkey not found',
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account locked due to multiple failed attempts. Please try again later.',
      });
    }

    // Validar que el passkey tenga todos los campos necesarios
    if (!passkey.credentialID || !passkey.credentialPublicKey) {
      console.error('Passkey missing required fields:', {
        hasCredentialID: !!passkey.credentialID,
        hasCredentialPublicKey: !!passkey.credentialPublicKey,
        passkeyId: passkey._id,
      });
      return res.status(500).json({
        success: false,
        message: 'Passkey data is incomplete',
      });
    }

    // Asegurar que counter tenga un valor válido
    // Si el counter es undefined, null, o NaN, usar 0
    let currentCounter = 0;
    if (passkey.counter !== undefined && passkey.counter !== null && !isNaN(passkey.counter)) {
      currentCounter = Number(passkey.counter);
    } else {
      // Si el counter no es válido, inicializarlo a 0 y guardarlo
      passkey.counter = 0;
      await passkey.save();
      currentCounter = 0;
    }

    // Preparar el objeto credential para simplewebauthn v13+
    // Asegurar que los Buffers estén en el formato correcto
    // simplewebauthn espera que id y publicKey sean Uint8Array o Buffer
    let credentialID = passkey.credentialID;
    let credentialPublicKey = passkey.credentialPublicKey;
    
    // Convertir a Buffer si no lo son ya
    if (!Buffer.isBuffer(credentialID)) {
      if (credentialID instanceof Uint8Array) {
        credentialID = Buffer.from(credentialID);
      } else if (typeof credentialID === 'string') {
        credentialID = Buffer.from(credentialID, 'base64');
      } else {
        credentialID = Buffer.from(credentialID);
      }
    }
    
    if (!Buffer.isBuffer(credentialPublicKey)) {
      if (credentialPublicKey instanceof Uint8Array) {
        credentialPublicKey = Buffer.from(credentialPublicKey);
      } else if (typeof credentialPublicKey === 'string') {
        credentialPublicKey = Buffer.from(credentialPublicKey, 'base64');
      } else {
        credentialPublicKey = Buffer.from(credentialPublicKey);
      }
    }
    
    const credentialData = {
      id: credentialID,
      publicKey: credentialPublicKey,
      counter: currentCounter,
      transports: passkey.transports || [],
    };

    console.log('Verifying authentication with passkey:', {
      passkeyId: passkey._id,
      counter: currentCounter,
      counterType: typeof currentCounter,
      hasCredentialID: !!passkey.credentialID,
      hasCredentialPublicKey: !!passkey.credentialPublicKey,
      credentialIDType: passkey.credentialID ? passkey.credentialID.constructor.name : 'undefined',
      credentialPublicKeyType: passkey.credentialPublicKey ? passkey.credentialPublicKey.constructor.name : 'undefined',
      credentialDataStructure: {
        hasId: !!credentialData.id,
        hasPublicKey: !!credentialData.publicKey,
        hasCounter: credentialData.counter !== undefined,
        counterValue: credentialData.counter,
      },
    });

    // Verify the authentication response
    // En versiones recientes de @simplewebauthn/server (v11+), el parámetro cambió de 'authenticator' a 'credential'
    // y la estructura cambió: credentialID -> id, credentialPublicKey -> publicKey
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: credentialData,
      requireUserVerification: true,
    });

    const { verified, authenticationInfo } = verification;

    if (!verified) {
      // Increment failed login attempts
      await user.incLoginAttempts();

      return res.status(401).json({
        success: false,
        message: 'Passkey authentication failed',
      });
    }

    // Update counter to prevent replay attacks
    if (authenticationInfo && authenticationInfo.newCounter !== undefined) {
      passkey.counter = authenticationInfo.newCounter;
    } else {
      // Si no hay newCounter, incrementar el counter actual
      passkey.counter = (passkey.counter || 0) + 1;
    }
    await passkey.save(); // Guardar el counter actualizado
    await passkey.updateLastUsed();

    // Reset failed login attempts
    await user.resetLoginAttempts();

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token
    await user.addRefreshToken(refreshToken);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Passkey authentication successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify passkey authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Get all passkeys for current user
// @route   GET /api/auth/passkey/list
// @access  Private
export const listPasskeys = async (req, res) => {
  try {
    const passkeys = await Passkey.find({ user: req.user._id })
      .select('name deviceType createdAt lastUsed transports')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { passkeys },
    });
  } catch (error) {
    console.error('Error listing passkeys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list passkeys',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Delete a passkey
// @route   DELETE /api/auth/passkey/:id
// @access  Private
export const deletePasskey = async (req, res) => {
  try {
    const { id } = req.params;

    const passkey = await Passkey.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!passkey) {
      return res.status(404).json({
        success: false,
        message: 'Passkey not found',
      });
    }

    await passkey.deleteOne();

    res.json({
      success: true,
      message: 'Passkey deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting passkey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete passkey',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
