import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Tag, ChevronLeft, User, FileText, Home, ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';
import MapComponents from '../components/MapComponents';
import { getStatusColor } from '../utils/statusColors';
import CommentSection from '../components/CommentSection';
import ReportButton from '../components/ReportButton';
import { useAuth } from '../contexts/AuthContext';

function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);

  useEffect(() => {
    const loadComplaint = async () => {
      try {
        const response = await api.get(`/api/complaints/${id}`);
        
        // Parse e valida as coordenadas do polígono
        let polygonCoordinates;
        try {
          polygonCoordinates = typeof response.data.polygonCoordinates === 'string' 
            ? JSON.parse(response.data.polygonCoordinates)
            : response.data.polygonCoordinates;

          // Validar se é um polígono válido
          if (!Array.isArray(polygonCoordinates) || polygonCoordinates.length < 3) {
            polygonCoordinates = null;
          }
        } catch (error) {
          console.error('Erro ao processar coordenadas:', error);
          polygonCoordinates = null;
        }

        setComplaint({
          ...response.data,
          polygonCoordinates
        });

        // Atualizar centro do mapa apenas se houver coordenadas válidas
        if (polygonCoordinates && polygonCoordinates.length > 0) {
          const center = polygonCoordinates.reduce((acc, coord) => ({
            lng: acc.lng + coord.lng,
            lat: acc.lat + coord.lat
          }), { lng: 0, lat: 0 });

          center.lng /= polygonCoordinates.length;
          center.lat /= polygonCoordinates.length;

          setSelectedPosition(center);
        }
      } catch (error) {
        setError('Erro ao carregar denúncia');
        console.error('Erro ao carregar denúncia:', error);
      } finally {
        setLoading(false);
      }
    };

    loadComplaint();
  }, [id]);

  const formatDate = (date) => {
    const now = new Date();
    const logDate = new Date(date);
    const diffTime = Math.abs(now - logDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const hours = logDate.getHours().toString().padStart(2, '0');
    const minutes = logDate.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    if (diffDays === 0) return `hoje às ${timeStr}`;
    if (diffDays === 1) return `há 1 dia`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return `${logDate.toLocaleDateString('pt-BR')}`;
  };

  const getLogMessage = (log) => {
    if (!log.oldStatus) {
      return 'criou a denúncia';
    }
    return 'alterou o status';
  };

  const formatAddress = (location) => {
    if (!location) return 'Localização não informada';

    // Tentar extrair os componentes do endereço
    try {
      const address = JSON.parse(location);
      return (
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <span className="text-gray-500 min-w-24">Logradouro:</span>
            <span className="text-gray-700">{address.logradouro || 'Não informado'}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-500 min-w-24">Bairro:</span>
            <span className="text-gray-700">{address.bairro || 'Não informado'}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-500 min-w-24">Cidade:</span>
            <span className="text-gray-700">{address.cidade || 'Não informada'}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-500 min-w-24">Estado:</span>
            <span className="text-gray-700">{address.estado || 'Não informado'}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-500 min-w-24">CEP:</span>
            <span className="text-gray-700">{address.cep || 'Não informado'}</span>
          </div>
        </div>
      );
    } catch {
      // Se não for um JSON, exibe como texto simples
      return (
        <div className="text-gray-700">
          {location}
        </div>
      );
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow">
        {/* Breadcrumb melhorado */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <nav className="container mx-auto" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-500 hover:text-blue-600 flex items-center"
                >
                  <Home className="h-4 w-4" />
                  <span className="ml-2">Início</span>
                </Link>
              </li>
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
                <Link
                  to="/denuncias"
                  className="text-gray-500 hover:text-blue-600"
                >
                  Denúncias
                </Link>
              </li>
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
                <span className="text-blue-600 font-medium">
                  Detalhes da Denúncia
                </span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="p-6 text-center text-gray-500">Carregando...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : complaint && (
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {complaint.title}
              </h1>
              
              {/* Adicionar botão de denúncia */}
              <ReportButton 
                type="complaint"
                targetId={complaint.id}
                userId={complaint.userId}
                currentUserId={user?.id}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações Principais */}
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    Descrição
                  </h2>
                  <p className="text-gray-700">{complaint.description}</p>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    Localização
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                      {formatAddress(complaint.location)}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    Status
                  </h2>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium
                    ${complaint.status === 'Resolvido' ? 'bg-green-100 text-green-800' : 
                    complaint.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-800' : 
                    complaint.status === 'Cancelado' ? 'bg-red-100 text-red-800' :
                    complaint.status === 'Em Verificação' ? 'bg-purple-100 text-purple-800' :
                    complaint.status === 'Reaberto' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'}`}>
                    {complaint.status || 'Em Análise'}
                  </span>
                </div>

                {complaint.Tags && complaint.Tags.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">
                      Tags
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {complaint.Tags.map(tag => (
                        <span
                          key={tag.id}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    Informações Adicionais
                  </h2>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Reportado por: {complaint.author?.nickname}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Data: {new Date(complaint.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mapa e Histórico */}
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    Área do Terreno
                  </h2>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <MapComponents
                      currentPosition={selectedPosition}
                      selectedPosition={selectedPosition}
                      readOnly={true}
                      initialPolygon={complaint.polygonCoordinates}
                      zoom={18}
                    />
                  </div>
                  {/* Adicionar informação sobre a área */}
                  {complaint?.polygonCoordinates && (
                    <p className="mt-2 text-sm text-gray-500">
                      Área demarcada com {complaint.polygonCoordinates.length} pontos
                    </p>
                  )}
                </div>

                {/* Histórico e Comentários */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  {/* Histórico de Alterações */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-4 border-b border-gray-100">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Histórico
                      </h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {complaint.ComplaintLogs?.map((log) => (
                        <div key={log.id} className="p-4 hover:bg-gray-50/50">
                          <div className="flex gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {log.changedBy?.nickname?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {log.changedBy?.nickname}
                                </p>
                                <span className="text-sm text-gray-500">
                                  {formatDate(log.createdAt)}
                                </span>
                              </div>
                              {!log.oldStatus ? (
                                <p className="text-sm text-gray-600 mt-1">
                                  criou a denúncia
                                </p>
                              ) : (
                                <div className="mt-1">
                                  <p className="text-sm text-gray-600">
                                    alterou o status de
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                                      ${log.oldStatus === 'Resolvido' ? 'bg-green-100 text-green-700' : 
                                      log.oldStatus === 'Em Andamento' ? 'bg-yellow-100 text-yellow-700' : 
                                      log.oldStatus === 'Cancelado' ? 'bg-red-100 text-red-700' :
                                      log.oldStatus === 'Em Verificação' ? 'bg-purple-100 text-purple-700' :
                                      log.oldStatus === 'Reaberto' ? 'bg-orange-100 text-orange-700' :
                                      'bg-blue-100 text-blue-700'}`}
                                    >
                                      {log.oldStatus}
                                    </span>
                                    <span className="text-gray-400">→</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                                      ${log.newStatus === 'Resolvido' ? 'bg-green-100 text-green-700' : 
                                      log.newStatus === 'Em Andamento' ? 'bg-yellow-100 text-yellow-700' : 
                                      log.newStatus === 'Cancelado' ? 'bg-red-100 text-red-700' :
                                      log.newStatus === 'Em Verificação' ? 'bg-purple-100 text-purple-700' :
                                      log.newStatus === 'Reaberto' ? 'bg-orange-100 text-orange-700' :
                                      'bg-blue-100 text-blue-700'}`}
                                    >
                                      {log.newStatus}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comentários */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-4 border-b border-gray-100">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Comentários
                      </h2>
                    </div>
                    <div className="p-4">
                      <CommentSection complaintId={id} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ComplaintDetails;