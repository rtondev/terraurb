import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000'
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
  async response => {
    const token = localStorage.getItem('@TerraurB:token');
    
    // Só verifica a sessão se houver token e não for uma rota de autenticação
    if (token && 
        !response.config.url.includes('/check-session') && 
        !response.config.url.includes('/login')) {
      try {
        const sessionCheck = await api.get('/api/auth/check-session');
        if (!sessionCheck.data.isActive) {
          localStorage.removeItem('@TerraurB:token');
          window.location.href = '/login';
          return Promise.reject('Sessão expirada');
        }
      } catch (error) {
        // Se o erro for 401 ou 403, significa que o token é inválido
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('@TerraurB:token');
          window.location.href = '/login';
          return Promise.reject('Sessão inválida');
        }
        console.error('Erro ao verificar sessão:', error);
      }
    }
    return response;
  },
  error => {
    // Se o erro for 401 ou 403, redireciona para login
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('@TerraurB:token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 