import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient'; // <<-- Revisi: Impor Supabase Client

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Supabase menyediakan listener untuk perubahan state otentikasi
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Otomatis memperbarui state user setiap kali ada perubahan
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Dapatkan session awal saat komponen dimuat
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Membersihkan listener saat komponen di-unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }
      
      // Supabase otomatis mengelola token dan data user di Local Storage
      // Jadi tidak perlu lagi memanggil localStorage.setItem() secara manual
      
      return { success: true };
    } catch (error) {
      console.error('Login Error:', error);
      return { 
        success: false, 
        message: error.message || 'Login gagal' 
      };
    }
  };

  const logout = async () => {
    // Panggil signOut Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Logout Error:", error);
    }
    // State user akan diatur menjadi null oleh onAuthStateChange
  };

  const isAdmin = () => {
    // Perlu implementasi untuk mengecek role di database atau metadata user
    // Contoh: return user?.user_metadata?.role === 'admin';
    return user?.email === 'admin@darulabror.com'; // Contoh sementara
  };
  
  const isWali = () => {
    // Contoh: return user?.user_metadata?.role === 'wali';
    return user?.email === 'wali@darulabror.com'; // Contoh sementara
  };

  const value = {
    user,
    login,
    logout,
    isAdmin,
    isWali,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};