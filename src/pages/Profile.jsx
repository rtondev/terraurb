import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, MapPin, Calendar, FileText, MessageSquare, Settings, LogOut } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const complaintsPerPage = 3;

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [userResponse, complaintsResponse] = await Promise.all([
        api.get('/api/auth/me'),
        api.get('/api/complaints/my')
      ]);

      console.log('Dados do usuário:', userResponse.data);
      console.log('Denúncias:', complaintsResponse.data);

      setUserData({
        user: userResponse.data,
        complaints: complaintsResponse.data.complaints || [],
        stats: complaintsResponse.data.stats || {
          total: 0,
          resolved: 0,
          inProgress: 0,
          pending: 0
        }
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;
  if (!userData) return <div>Usuário não encontrado</div>;

  const { user, complaints } = userData;
  const totalPages = Math.ceil((complaints?.length || 0) / complaintsPerPage);
  const paginatedComplaints = complaints?.slice(
    (currentPage - 1) * complaintsPerPage,
    currentPage * complaintsPerPage
  );

  return (
    <Layout>
      <div className="max-w-3xl mx-auto min-h-screen border-x border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Perfil</h1>
            <div className="flex items-center gap-2">
              <Link
                to="/configuracoes"
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
              >
                <Settings className="w-6 h-6" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50"
                title="Sair"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Banner e Avatar */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <div className="absolute -bottom-16 left-4">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-white flex items-center justify-center">
              <User className="w-16 h-16 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Informações do Perfil */}
        <div className="px-4 pt-20 pb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">@{user.nickname}</h2>
          </div>

          <div className="mt-4 space-y-2 text-gray-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            {user.city && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{user.city}</span>
              </div>
            )}
            {user.age && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Idade: {user.age} anos</span>
              </div>
            )}
          </div>
        </div>

        {/* Denúncias */}
        <div className="border-t border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Denúncias</h3>
              <Link
                to="/denuncias/nova"
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Nova Denúncia
              </Link>
            </div>
          </div>

          {!complaints?.length ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nenhuma denúncia ainda</p>
              <Link
                to="/denuncias/nova"
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Criar primeira denúncia
              </Link>
            </div>
          ) : (
            <div>
              {paginatedComplaints.map(complaint => (
                <div
                  key={complaint.id}
                  className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                        ${complaint.status === 'Resolvido' ? 'bg-green-100 text-green-700' : 
                        complaint.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-blue-100 text-blue-700'}`}
                      >
                        {complaint.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-900">{complaint.description}</p>
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{complaint.location}</span>
                    </div>
                    {complaint.Tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {complaint.Tags.map(tag => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link
                      to={`/denuncias/${complaint.id}`}
                      className="self-end text-blue-500 hover:text-blue-600 text-sm font-medium"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              ))}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-1 p-4">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-full text-sm font-medium
                        ${currentPage === i + 1
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Profile; 