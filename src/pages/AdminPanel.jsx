import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { USER_ROLES } from '../config/constants';
import { API_BASE_URL } from '../config/api';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token não encontrado');
        }

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Falha ao obter perfil');
        }

        const profile = await response.json();
        if (profile.role !== USER_ROLES.ADMIN) {
          navigate('/');
        }
      } catch (err) {
        setError('Acesso não autorizado');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded inline-block">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usuários</h2>
          <p className="text-gray-600 mb-4">Gerencie os usuários do sistema</p>
          <button
            onClick={() => navigate('/admin/users')}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Gerenciar Usuários
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Denúncias</h2>
          <p className="text-gray-600 mb-4">Visualize e gerencie todas as denúncias</p>
          <button
            onClick={() => navigate('/complaints')}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Ver Denúncias
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Relatórios</h2>
          <p className="text-gray-600 mb-4">Acesse relatórios e estatísticas</p>
          <button
            onClick={() => navigate('/admin/reports')}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Ver Relatórios
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Configurações do Sistema</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
            <p className="text-gray-600 mb-2">Gerencie as tags disponíveis para denúncias</p>
            <button
              onClick={() => navigate('/admin/tags')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Gerenciar Tags
            </button>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Status</h3>
            <p className="text-gray-600 mb-2">Configure os status possíveis para denúncias</p>
            <button
              onClick={() => navigate('/admin/status')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Gerenciar Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
