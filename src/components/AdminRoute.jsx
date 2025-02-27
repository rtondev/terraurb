import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminRoute() {
  const { user, token } = useAuth();
  
  // Se não estiver autenticado, redireciona para login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Se não for admin, redireciona para home
  if (user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  // Se for admin, renderiza o componente filho
  return <Outlet />;
}

export default AdminRoute; 