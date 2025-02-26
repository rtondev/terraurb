import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Complaints from './pages/Complaints';
import Tags from './pages/Tags';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Profile from './pages/Profile';
import CreateComplaint from './pages/CreateComplaint';
import ComplaintDetails from './pages/ComplaintDetails';
import Settings from './pages/Settings';
import EditProfile from './pages/EditProfile';
import Devices from './pages/Devices';
import PublicProfile from './pages/PublicProfile';
import ActivityLogs from './pages/ActivityLogs';
// Componente para proteger rotas
const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

// Componente para proteger rotas de admin
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rotas protegidas */}
          <Route path="/" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } />
          <Route path="/denuncias" element={
            <PrivateRoute>
              <Complaints />
            </PrivateRoute>
          } />
          <Route path="/denuncias/nova" element={
            <PrivateRoute>
              <CreateComplaint />
            </PrivateRoute>
          } />
          <Route path="/denuncias/:id" element={
            <PrivateRoute>
              <ComplaintDetails />
            </PrivateRoute>
          } />
          <Route path="/tags" element={
            <AdminRoute>
              <Tags />
            </AdminRoute>
          } />
          <Route path="/reportes" element={
            <AdminRoute>
              <Reports />
            </AdminRoute>
          } />
          <Route path="/usuarios" element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          } />
          <Route path="/perfil" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          <Route path="/configuracoes" element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } />
          <Route path="/configuracoes/perfil" element={
            <PrivateRoute>
              <EditProfile />
            </PrivateRoute>
          } />
          <Route path="/configuracoes/logs" element={<ActivityLogs />} />
          <Route path="/configuracoes/dispositivos" element={
            <PrivateRoute>
              <Devices />
            </PrivateRoute>
          } />
          <Route path="/configuracoes/logs" element={
            <PrivateRoute>
              <ActivityLogs />
            </PrivateRoute>
          } />
          <Route path="/:nickname" element={<PublicProfile />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
