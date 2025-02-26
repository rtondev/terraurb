import axios from 'axios';

const api = axios.create({
  // Use environment variable for API URL with fallback
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem('@TerraurB:token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  response => response,
  error => {
    // Não redireciona se estiver nas rotas de autenticação
    const authRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/check-nickname', '/api/auth/send-verification-code', '/api/auth/verify-code'];
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (!authRoutes.some(route => error.config.url.includes(route))) {
        localStorage.removeItem('@TerraurB:token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api; 