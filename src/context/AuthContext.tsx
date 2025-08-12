// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface User {
  uid: string;
  email: string | null;
  role: 'user' | 'admin';
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user document exists
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userData?.role || 'user'
            });
          } else {
            // Create user document if it doesn't exist
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              email: firebaseUser.email,
              role: 'user',
              createdAt: serverTimestamp()
            });
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'user'
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Even if Firestore fails, we can still set basic user info
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'user'
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create user document
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: email,
      role: 'user',
      createdAt: serverTimestamp()
    });
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};