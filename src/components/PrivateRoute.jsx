import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PrivateRoute() {
  const { token } = useAuth();
  
  // Se não estiver autenticado, redireciona para login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Se estiver autenticado, renderiza o componente filho
  return <Outlet />;
}

export default PrivateRoute; 