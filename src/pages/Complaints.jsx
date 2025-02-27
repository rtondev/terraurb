import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Tag, Plus, Search, Filter } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';
import { getStatusColor } from '../utils/statusColors';

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await api.get('/api/complaints');
      setComplaints(response.data);
    } catch (error) {
      setError('Erro ao carregar denúncias');
    } finally {
      setLoading(false);
    }
  };

  const formatLocation = (location) => {
    // Limita a localização a no máximo 40 caracteres
    return location.length > 40 ? location.substring(0, 37) + '...' : location;
  };

  const formatDate = (date) => {
    const now = new Date();
    const complaintDate = new Date(date);
    const diffTime = Math.abs(now - complaintDate);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Se for menos de 1 hora
    if (diffMinutes < 60) {
      if (diffMinutes === 0) return 'Agora';
      if (diffMinutes === 1) return 'há 1 minuto';
      return `há ${diffMinutes} minutos`;
    }
    
    // Se for menos de 24 horas
    if (diffHours < 24) {
      if (diffHours === 1) return 'há 1 hora';
      return `há ${diffHours} horas`;
    }
    
    // Se for menos de 7 dias
    if (diffDays < 7) {
      if (diffDays === 1) return 'há 1 dia';
      return `há ${diffDays} dias`;
    }

    // Se for no mesmo ano
    if (complaintDate.getFullYear() === now.getFullYear()) {
      return complaintDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Se for em outro ano
    return complaintDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredComplaints = complaints
    .filter(complaint => {
      const matchesSearch = complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          complaint.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || complaint.status === filter;
      return matchesSearch && matchesFilter;
    });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Denúncias</h1>
          <Link
            to="/denuncias/nova"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nova Denúncia
          </Link>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por localização ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 h-5 w-5" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="Pendente">Pendentes</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Resolvido">Resolvidos</option>
            </select>
          </div>
        </div>

        {/* Lista de Denúncias */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredComplaints.map(complaint => (
              <Link
                key={complaint.id}
                to={`/denuncias/${complaint.id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-all duration-200"
              >
                {complaint.images?.[0] && (
                  <div className="h-48 rounded-t-lg overflow-hidden">
                    <img
                      src={complaint.images[0]}
                      alt="Denúncia"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}
                      >
                        {complaint.status}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(complaint.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-900 mb-3 line-clamp-2">
                    {complaint.description}
                  </p>

                  <div className="flex items-center gap-2 text-gray-500 mb-3">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">
                      {formatLocation(complaint.location)}
                    </span>
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
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Estado vazio */}
        {!loading && filteredComplaints.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma denúncia encontrada
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Tente ajustar seus filtros de busca'
                : 'Seja o primeiro a fazer uma denúncia'}
            </p>
            <Link
              to="/denuncias/nova"
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nova Denúncia
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Complaints;