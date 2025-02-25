import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('@TerraurB:token'));
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, role } = response.data;
      
      localStorage.setItem('@TerraurB:token', token);
      setToken(token);
      
      // Buscar dados do usuário
      const userResponse = await api.get('/api/auth/me');
      setUser(userResponse.data);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  };

  const register = async (email) => {
    try {
      const response = await api.post('/api/auth/register', { email });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao registrar usuário'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('@TerraurB:token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      token,
      user,
      login,
      register,
      logout,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 