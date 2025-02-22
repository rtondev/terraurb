import { createBrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Complaints from '../pages/Complaints';
import ComplaintDetail from '../pages/ComplaintDetail';
import AdminPanel from '../pages/AdminPanel';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';
import Welcome from '../pages/Welcome';

export const router = createBrowserRouter([
  { path: '/', element: <Welcome /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/complaints', element: <Complaints /> },
  { path: '/complaints/new', element: <ComplaintDetail /> },
  { path: '/complaints/:id', element: <ComplaintDetail /> },
  { path: '/admin', element: <AdminPanel /> },
  { path: '/profile', element: <Profile /> },
  { path: '*', element: <NotFound /> }
]);