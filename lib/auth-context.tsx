"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Lead, UserProfile, UserRole } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  role: UserRole;
  isAdmin: boolean;
  isManager: boolean;
  isSales: boolean;
  canEditLead: (lead?: Lead) => boolean;
  canDeleteLead: () => boolean;
  canAssignLead: () => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  role: "Admin",
  isAdmin: true,
  isManager: false,
  isSales: false,
  canEditLead: () => true,
  canDeleteLead: () => true,
  canAssignLead: () => true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        unsubscribeProfile = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email || data.email || "",
                role: (data.role as UserRole) || "Admin",
                displayName: data.displayName || firebaseUser.displayName || "",
                createdAt: data.createdAt || null,
              });
            } else {
              setUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                role: "Admin",
                displayName: firebaseUser.displayName || "",
              });
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user profile from Firestore:", error);
            setUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              role: "Admin",
              displayName: firebaseUser.displayName || "",
            });
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Failed to clear session cookie:", e);
    }
    await firebaseSignOut(auth);
  };

  const role: UserRole = userProfile?.role || "Admin";
  const isAdmin = role === "Admin";
  const isManager = role === "Manager";
  const isSales = role === "Sales";

  const canEditLead = (lead?: Lead) => {
    if (!user) return false;
    if (isAdmin || isManager) return true;
    if (isSales && lead) {
      return (
        !lead.assignedTo ||
        lead.assignedTo === user.email ||
        lead.assignedTo === user.uid
      );
    }
    return true;
  };

  const canDeleteLead = () => isAdmin;
  const canAssignLead = () => isAdmin || isManager;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        role,
        isAdmin,
        isManager,
        isSales,
        canEditLead,
        canDeleteLead,
        canAssignLead,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
