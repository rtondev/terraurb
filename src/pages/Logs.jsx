import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, UserPlus, Settings, FileEdit, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import api from '../services/api';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await api.get('/api/auth/activity-logs');
      setLogs(response.data);
    } catch (error) {
      setError('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type) => {
    const iconProps = { className: "h-5 w-5" };
    switch (type) {
      case 'login': return <UserPlus {...iconProps} />;
      case 'settings': return <Settings {...iconProps} />;
      case 'edit': return <FileEdit {...iconProps} />;
      case 'delete': return <Trash2 {...iconProps} />;
      default: return <Clock {...iconProps} />;
    }
  };

  const formatRelativeTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const logDate = new Date(date);
    const diffInSeconds = Math.floor((now - logDate) / 1000);
    
    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800) return `há ${Math.floor(diffInSeconds / 86400)} dias`;
    
    return logDate.toLocaleDateString();
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-white">
        <TopBar 
          title="Histórico de Alterações" 
          backTo="/configuracoes"
        />

        <div className="flex-1 pt-14">
          <div className="max-w-3xl mx-auto">
            {/* Atividades Recentes */}
            <div className="px-4 py-6">
              <h2 className="text-sm font-medium text-gray-500 mb-4">ATIVIDADES RECENTES</h2>
              <div className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <div key={log.id} className="py-4 flex items-start gap-4">
                    <div className={`p-2 rounded-full ${
                      log.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {getActionIcon(log.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{log.description}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-gray-500">
                          {formatRelativeTime(log.createdAt)}
                        </p>
                        {log.deviceInfo && (
                          <>
                            <span className="text-gray-300">•</span>
                            <p className="text-sm text-gray-500">
                              {log.deviceInfo.browser} - {log.deviceInfo.os}
                            </p>
                            <span className="text-gray-300">•</span>
                            <p className="text-sm text-gray-500">
                              {log.deviceInfo.location?.city || 'Local desconhecido'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estados de loading/erro/vazio */}
            {loading && (
              <div className="p-8 text-center text-gray-500">
                Carregando histórico...
              </div>
            )}

            {error && (
              <div className="p-8 text-center text-red-500">
                {error}
              </div>
            )}

            {!loading && !error && logs.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Nenhuma atividade encontrada
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Logs; 