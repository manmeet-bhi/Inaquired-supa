import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AdminUser } from '../types/job';
import { verifyTotpToken } from '../utils/totpUtils';

interface AuthContextType {
  currentUser: User | null;
  adminData: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
  mfaRequired: boolean;
  isMfaVerified: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  verifyMfa: (token: string) => Promise<boolean>;
  verifyBackupCode: (code: string) => Promise<boolean>;
  saveMfaEnrollment: (secret: string, backupCodes: string[]) => Promise<void>;
  disableMfa: () => Promise<void>;
  logout: () => Promise<void>;
  recordAuditLog: (action: string, targetResource: string, details?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Superadmin email recognized by system
const SYSTEM_ADMIN_EMAIL = 'manmeet.msh@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [mfaRequired, setMfaRequired] = useState<boolean>(false);
  const [isMfaVerified, setIsMfaVerified] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Check admin doc
          const adminDocRef = doc(db, 'admins', user.uid);
          const adminSnap = await getDoc(adminDocRef);

          const isSystemEmail = user.email?.toLowerCase() === SYSTEM_ADMIN_EMAIL.toLowerCase();

          if (adminSnap.exists()) {
            const data = adminSnap.data() as AdminUser;
            setAdminData(data);
            setIsAdmin(true);

            if (data.mfaEnabled) {
              setMfaRequired(true);
              setIsMfaVerified(false);
            } else {
              setMfaRequired(false);
              setIsMfaVerified(true);
            }
          } else if (isSystemEmail) {
            // First time bootstrap for system admin
            const newAdminData: AdminUser = {
              uid: user.uid,
              email: user.email || SYSTEM_ADMIN_EMAIL,
              role: 'superadmin',
              mfaEnabled: false,
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(adminDocRef, newAdminData);
            } catch (e) {
              console.warn('Could not auto-write admin doc (will use in-memory status):', e);
            }
            setAdminData(newAdminData);
            setIsAdmin(true);
            setMfaRequired(false);
            setIsMfaVerified(true);
          } else {
            // Not an authorized admin
            setIsAdmin(false);
            setAdminData(null);
            setMfaRequired(false);
            setIsMfaVerified(false);
          }
        } catch (err) {
          console.error('Error checking admin status:', err);
          if (user.email?.toLowerCase() === SYSTEM_ADMIN_EMAIL.toLowerCase()) {
            setIsAdmin(true);
            setIsMfaVerified(true);
          }
        }
      } else {
        setIsAdmin(false);
        setAdminData(null);
        setMfaRequired(false);
        setIsMfaVerified(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const verifyMfa = async (token: string): Promise<boolean> => {
    if (!adminData?.mfaSecret) return false;
    const isValid = await verifyTotpToken(adminData.mfaSecret, token);
    if (isValid) {
      setIsMfaVerified(true);
      await recordAuditLog('MFA_VERIFIED', 'session', 'TOTP 2FA verification succeeded');
      return true;
    }
    return false;
  };

  const verifyBackupCode = async (code: string): Promise<boolean> => {
    if (!adminData?.backupCodes || !currentUser) return false;
    const normalized = code.trim().toUpperCase();
    const index = adminData.backupCodes.findIndex((c) => c === normalized);
    if (index !== -1) {
      const remainingCodes = [...adminData.backupCodes];
      remainingCodes.splice(index, 1);
      const updated: AdminUser = {
        ...adminData,
        backupCodes: remainingCodes,
      };
      setAdminData(updated);
      setIsMfaVerified(true);
      try {
        await setDoc(doc(db, 'admins', currentUser.uid), { backupCodes: remainingCodes }, { merge: true });
      } catch (e) {
        console.warn('Could not update remaining backup codes in Firestore:', e);
      }
      await recordAuditLog('BACKUP_CODE_USED', 'session', 'One-time emergency backup code consumed');
      return true;
    }
    return false;
  };

  const saveMfaEnrollment = async (secret: string, backupCodes: string[]) => {
    if (!currentUser) return;
    const updated: Partial<AdminUser> = {
      mfaEnabled: true,
      mfaSecret: secret,
      backupCodes: backupCodes,
    };
    await setDoc(doc(db, 'admins', currentUser.uid), updated, { merge: true });
    setAdminData((prev) => prev ? { ...prev, ...updated } : null);
    setIsMfaVerified(true);
    setMfaRequired(true);
    await recordAuditLog('MFA_ENABLED', 'admin_security', '2FA Authenticator app enrolled with backup codes');
  };

  const disableMfa = async () => {
    if (!currentUser) return;
    const updated: Partial<AdminUser> = {
      mfaEnabled: false,
      mfaSecret: undefined,
      backupCodes: [],
    };
    await setDoc(doc(db, 'admins', currentUser.uid), updated, { merge: true });
    setAdminData((prev) => prev ? { ...prev, ...updated } : null);
    setIsMfaVerified(true);
    setMfaRequired(false);
    await recordAuditLog('MFA_DISABLED', 'admin_security', '2FA was disabled for admin account');
  };

  const recordAuditLog = async (action: string, targetResource: string, details?: string) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'auditLogs'), {
        adminId: currentUser.uid,
        adminEmail: currentUser.email || 'unknown',
        action,
        targetResource,
        details: details || '',
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Audit log write skipped or failed:', e);
    }
  };

  const logout = async () => {
    if (currentUser) {
      await recordAuditLog('LOGOUT', 'session', 'Admin logged out');
    }
    await signOut(auth);
    setIsMfaVerified(false);
    setMfaRequired(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        adminData,
        isAdmin,
        loading,
        mfaRequired,
        isMfaVerified,
        loginWithGoogle,
        loginWithEmail,
        sendPasswordReset,
        verifyMfa,
        verifyBackupCode,
        saveMfaEnrollment,
        disableMfa,
        logout,
        recordAuditLog,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
