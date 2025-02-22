import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { USER_ROLES } from '../config/constants';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // TODO: Implement fetch user profile
      setUser({ role: 'USER' }); // Temporary user object
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              to={user ? '/dashboard' : '/'} 
              className="text-xl font-bold hover:text-blue-200 transition-colors duration-200"
            >
              🏙️ Terraurb
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {user && (
              <Link 
                to="/complaints" 
                className="text-sm font-medium hover:text-blue-200 transition-colors duration-200"
              >
                Denúncias
              </Link>
            )}
            {user ? (
              <div className="flex items-center space-x-6">
                {user.role === USER_ROLES.ADMIN && (
                  <Link 
                    to="/admin" 
                    className="text-sm font-medium hover:text-blue-200 transition-colors duration-200"
                  >
                    Admin
                  </Link>
                )}
                <Link 
                  to="/profile" 
                  className="text-sm font-medium hover:text-blue-200 transition-colors duration-200"
                >
                  Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <Link 
                  to="/login" 
                  className="text-sm font-medium hover:text-blue-200 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
