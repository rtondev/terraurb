import React, { useState, useEffect } from 'react';
import { Clock, Info, Shield, AlertTriangle } from 'lucide-react';
import TopBar from '../components/TopBar';
import api from '../services/api';

function ActivityLogs() {
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
      setError('Erro ao carregar logs de atividade');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const options = { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(date).toLocaleDateString('pt-BR', options);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'profile':
        return <Clock className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const ActivityCard = ({ log }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50">
              {getActivityIcon(log.type)}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{log.description}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(log.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
      {log.deviceInfo && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            {log.deviceInfo.browser} - {log.deviceInfo.os}
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <TopBar title="Logs de Atividade" backTo="/configuracoes" />
        <div className="flex-1 pt-16 pb-8">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando logs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Logs de Atividade" backTo="/configuracoes" />

      <div className="flex-1 pt-16 pb-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Lista de Logs */}
          <div className="space-y-3">
            {logs.map((log) => (
              <ActivityCard key={log.id} log={log} />
            ))}
          </div>

          {/* Estado vazio */}
          {!loading && !error && logs.length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma atividade encontrada</p>
            </div>
          )}

          {/* Estado de erro */}
          {error && (
            <div className="text-center py-12">
              <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivityLogs; 