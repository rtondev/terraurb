import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import api from '../services/api';

function PublicProfile() {
  const { nickname } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, [nickname]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/api/auth/profile/${nickname}`);
      setProfile(response.data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setError(
        error.response?.data?.error || 
        'Erro ao carregar perfil. Tente novamente mais tarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-red-500 mb-4">{error}</div>
          <Link to="/" className="text-blue-500 hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-white">
        <TopBar title={`Perfil de ${profile.nickname}`} backTo="/" />

        <div className="flex-1 pt-14">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Cabeçalho do Perfil */}
            <div className="flex items-start gap-6 mb-8">
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.nickname}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl text-gray-500">
                    {profile.nickname[0].toUpperCase()}
                  </span>
                </div>
              )}

              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
                <p className="text-gray-500">@{profile.nickname}</p>
                
                {profile.location !== 'Localização não informada' && (
                  <div className="flex items-center gap-2 mt-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-1 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Membro desde {new Date(profile.memberSince).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Sobre</h2>
                <p className="text-gray-600">{profile.bio}</p>
              </div>
            )}

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {profile.stats.totalComplaints}
                </div>
                <div className="text-sm text-blue-600">Total de Denúncias</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {profile.stats.resolvedComplaints}
                </div>
                <div className="text-sm text-green-600">Denúncias Resolvidas</div>
              </div>
            </div>

            {/* Denúncias Recentes */}
            {profile.recentComplaints.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Denúncias Recentes
                </h2>
                <div className="space-y-4">
                  {profile.recentComplaints.map(complaint => (
                    <Link 
                      key={complaint.id}
                      to={`/denuncias/${complaint.id}`}
                      className="block bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{complaint.title}</h3>
                        <span className={`flex items-center gap-1 ${
                          complaint.status === 'resolved' 
                            ? 'text-green-600' 
                            : 'text-yellow-600'
                        }`}>
                          {complaint.status === 'resolved' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                          {complaint.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(complaint.date).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default PublicProfile; 