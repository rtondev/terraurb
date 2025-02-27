import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  MapPin, Plus, ChevronRight, Users, AlertTriangle, 
  Clock, Sparkles, ArrowUpRight, Target, Eye 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import GlobalMap from '../components/GlobalMap';

function Home() {
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allComplaints, setAllComplaints] = useState([]);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    totalUsers: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [complaintsResponse, statsResponse] = await Promise.all([
        api.get('/api/complaints'),
        api.get('/api/stats')
      ]);

      setRecentComplaints(complaintsResponse.data.slice(0, 5));
      setAllComplaints(complaintsResponse.data);
      setStats({
        totalComplaints: complaintsResponse.data.length,
        totalUsers: statsResponse.data.users
      });
    } catch (error) {
      setError('Erro ao carregar dados');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLocation = (location) => {
    if (!location) return '';
    // Limitar a 30 caracteres e adicionar "..." se necessário
    return location.length > 30 ? location.substring(0, 30) + '...' : location;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section - mais compacta */}
      <div className="relative mb-8 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 rounded-xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-700/50" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 text-white text-sm backdrop-blur-sm mb-4">
            <Sparkles className="h-3 w-3 mr-1.5" />
            Contribua para uma cidade melhor
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
            Transforme sua cidade através da colaboração
          </h1>
          <p className="text-base text-blue-100 mb-6 leading-relaxed max-w-xl">
            Participe ativamente da transformação urbana. Denuncie, acompanhe e ajude a construir uma cidade mais limpa.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/denuncias/nova"
              className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nova Denúncia
            </Link>
            <Link
              to="/denuncias"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-all border border-white/20"
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Explorar
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section - mais compacta */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.totalComplaints}
              </h3>
              <p className="text-sm text-gray-600">Denúncias Registradas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.totalUsers}
              </h3>
              <p className="text-sm text-gray-600">Voluntários Ativos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa Global - mais compacto */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8 border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Mapa de Denúncias
          </h2>
          <p className="text-sm text-gray-600">
            Visualize todas as denúncias em sua região
          </p>
        </div>
        <GlobalMap complaints={allComplaints} />
      </div>

      {/* Denúncias Recentes - mais compacta */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Últimas Denúncias
            </h2>
            <p className="text-sm text-gray-600">
              Acompanhe as atualizações mais recentes
            </p>
          </div>
          <Link
            to="/denuncias"
            className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all"
          >
            Ver todas
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div>
          {recentComplaints.slice(0, 5).map((complaint) => (
            <div key={complaint.id} className="p-4 hover:bg-gray-50 transition-all border-b border-gray-100 last:border-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">
                    {complaint.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                      {formatLocation(complaint.location)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${complaint.status === 'Resolvido' ? 'bg-green-100 text-green-700' : 
                    complaint.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-700' : 
                    complaint.status === 'Cancelado' ? 'bg-red-100 text-red-700' :
                    complaint.status === 'Em Verificação' ? 'bg-purple-100 text-purple-700' :
                    complaint.status === 'Reaberto' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'}`}
                  >
                    {complaint.status}
                  </span>
                </div>
                <Link
                  to={`/denuncias/${complaint.id}`}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-all"
                >
                  Detalhes
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          ))}

          {recentComplaints.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-3 bg-gray-50 rounded-full mb-3">
                <AlertTriangle className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">
                Nenhuma denúncia encontrada
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Home; 