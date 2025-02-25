import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { User, Trash2, Shield } from 'lucide-react';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await api.delete(`/api/admin/users/${id}`);
        loadUsers();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
      }
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">Usuários</h1>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div key={user.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <User className="h-10 w-10 text-gray-400 bg-gray-200 rounded-full p-2" />
                      <div className="ml-3">
                        <h3 className="text-gray-900 font-medium">{user.nickname}</h3>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                      </div>
                    </div>
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <div className="mt-4 flex items-center">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="ml-2 text-sm font-medium text-blue-500">
                      {user.role === 'admin' ? 'Administrador' : 
                       user.role === 'city_hall' ? 'Funcionário' : 'Usuário'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Users; 