import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Shield, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
      setError('');
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError('Erro ao carregar lista de usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (userId, currentRole) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      await api.patch(`/api/admin/users/${userId}/role`, {
        role: newRole
      });

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast.success(`Permissões de ${newRole === 'admin' ? 'administrador' : 'usuário'} atualizadas com sucesso`);
    } catch (error) {
      console.error('Erro ao alterar permissão:', error);
      toast.error('Erro ao alterar permissões do usuário');
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Gerenciar Usuários</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <div className="min-w-full">
              {/* Versão para Desktop */}
              <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.nickname}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRoleToggle(user.id, user.role)}
                          className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                            user.role === 'admin'
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          {user.role === 'admin' ? (
                            <>
                              <ShieldAlert className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Remover Admin</span>
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Tornar Admin</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Versão para Mobile */}
              <div className="sm:hidden divide-y divide-gray-200">
                {users.map(user => (
                  <div key={user.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.nickname}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {user.email}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Usuário'}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleRoleToggle(user.id, user.role)}
                        className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                          user.role === 'admin'
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {user.role === 'admin' ? (
                          <>
                            <ShieldAlert className="h-4 w-4 mr-1" />
                            Remover Admin
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-1" />
                            Tornar Admin
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Users; 