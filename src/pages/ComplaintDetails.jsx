import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Tag, ChevronLeft, User, FileText, Home } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';
import MapComponents from '../components/MapComponents';
import { getStatusColor } from '../utils/statusColors';

function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState(null);

  useEffect(() => {
    const loadComplaint = async () => {
      try {
        const response = await api.get(`/api/complaints/${id}`);
        console.log('Dados da denúncia:', response.data);
        
        // Parse polygon coordinates if they are stored as a string
        const polygonCoordinates = typeof response.data.polygonCoordinates === 'string' 
          ? JSON.parse(response.data.polygonCoordinates)
          : response.data.polygonCoordinates;

        console.log('Coordenadas do polígono:', polygonCoordinates);
        
        // Update complaint data with parsed coordinates
        setComplaint({
          ...response.data,
          polygonCoordinates
        });

        // Se houver coordenadas do polígono, centralizar o mapa no centro do polígono
        if (polygonCoordinates && Array.isArray(polygonCoordinates) && polygonCoordinates.length > 0) {
          console.log('Processando coordenadas para centro do mapa:', polygonCoordinates);
          // Calcular o centro do polígono
          const bounds = polygonCoordinates.reduce((acc, coord) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              return {
                minLng: Math.min(acc.minLng, coord[0]),
                maxLng: Math.max(acc.maxLng, coord[0]),
                minLat: Math.min(acc.minLat, coord[1]),
                maxLat: Math.max(acc.maxLat, coord[1])
              };
            }
            return acc;
          }, {
            minLng: Infinity,
            maxLng: -Infinity,
            minLat: Infinity,
            maxLat: -Infinity
          });

          if (bounds.minLng !== Infinity && bounds.maxLng !== -Infinity) {
            const center = {
              lng: (bounds.minLng + bounds.maxLng) / 2,
              lat: (bounds.minLat + bounds.maxLat) / 2
            };
            console.log('Centro calculado do mapa:', center);
            setMapCenter(center);
          }
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

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow">
        {/* Breadcrumb */}
        <div className="p-4 border-b border-gray-200">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/" className="text-gray-400 hover:text-gray-500">
                  <Home className="h-5 w-5" />
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronLeft className="h-5 w-5 text-gray-400" />
                  <Link
                    to="/denuncias"
                    className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Denúncias
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronLeft className="h-5 w-5 text-gray-400" />
                  <span className="ml-4 text-sm font-medium text-gray-700">
                    Detalhes da Denúncia
                  </span>
                </div>
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
            {/* Título da denúncia */}
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {complaint.title}
            </h1>

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
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-5 w-5 mr-2" />
                    {complaint.location}
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
                      currentPosition={null}
                      selectedPosition={null}
                      mapType="satellite"
                      polygonCoordinates={complaint?.polygonCoordinates}
                      readOnly={true}
                      center={mapCenter}
                      zoom={18}
                      statusColor={getStatusColor(complaint?.status)}
                    />
                  </div>
                  {/* Adicionar informação sobre a área */}
                  {complaint?.polygonCoordinates && (
                    <p className="mt-2 text-sm text-gray-500">
                      Área demarcada com {complaint.polygonCoordinates.length} pontos
                    </p>
                  )}
                </div>

                {complaint.ComplaintLogs && complaint.ComplaintLogs.length > 0 && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">
                      Histórico de Alterações
                    </h2>
                    <div className="space-y-4">
                      {complaint.ComplaintLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 text-sm"
                        >
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-gray-600">
                              {new Date(log.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-gray-900">
                              Status alterado de{' '}
                              <span className="font-medium">{log.oldStatus}</span>
                              {' '}para{' '}
                              <span className="font-medium">{log.newStatus}</span>
                            </p>
                            <p className="text-gray-600">
                              por {log.changedBy?.nickname}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ComplaintDetails;