import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import { MapPin, Calendar, User, Tag, AlertCircle, Plus, Search, Filter, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await api.get('/api/complaints');
      setComplaints(response.data);
      setError('');
    } catch (error) {
      console.error('Erro ao carregar denúncias:', error);
      setError('Erro ao carregar denúncias');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Em Análise': 'bg-yellow-100 text-yellow-800',
      'Em Andamento': 'bg-blue-100 text-blue-800',
      'Resolvido': 'bg-green-100 text-green-800',
      'Cancelado': 'bg-red-100 text-red-800',
      'Em Verificação': 'bg-purple-100 text-purple-800',
      'Reaberto': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || complaint.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Denúncias
          </h1>
          
          <Link
            to="/denuncias/nova"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Denúncia
          </Link>
        </div>

        {/* Filtros e Busca */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar denúncias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">Todos os status</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Resolvido">Resolvido</option>
              <option value="Cancelado">Cancelado</option>
              <option value="Em Verificação">Em Verificação</option>
              <option value="Reaberto">Reaberto</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComplaints.map(complaint => (
              <div
                key={complaint.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col"
              >
                <Link
                  to={`/denuncias/${complaint.id}`}
                  className="flex-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {complaint.title}
                    </h2>
                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {complaint.description}
                  </p>
                </Link>

                <div className="mt-auto space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="line-clamp-1">{complaint.location}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <Link 
                        to={`/usuario/${complaint.user.id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {complaint.user.nickname}
                      </Link>
                    </div>
                    {complaint.commentsCount > 0 && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <MessageSquare className="h-4 w-4" />
                        <span>{complaint.commentsCount}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{formatDate(complaint.createdAt)}</span>
                  </div>

                  {complaint.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
                      <Tag className="h-4 w-4 flex-shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {complaint.tags.map(tag => (
                          <span
                            key={tag.id}
                            className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredComplaints.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Nenhuma denúncia encontrada
            </h3>
            <p className="mt-2 text-gray-500">
              {searchTerm || selectedStatus ? 
                'Tente ajustar seus filtros de busca' : 
                'Seja o primeiro a criar uma denúncia'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Complaints;