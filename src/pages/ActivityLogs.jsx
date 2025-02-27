import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Loader2, Clock, User } from 'lucide-react';

function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await api.get('/api/admin/activity-logs');
      setLogs(response.data);
      setError('');
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      setError('Erro ao carregar logs de atividade');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Logs de Atividade</h2>

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
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum log de atividade encontrado
              </p>
            ) : (
              logs.map((log) => (
                <div 
                  key={log.id} 
                  className="bg-white rounded-lg shadow p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-full">
                        <User className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-medium text-gray-900">
                          {log.user?.nickname || 'Usuário removido'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {log.action}
                        </p>
                        {log.details && (
                          <div className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-md p-2">
                            <pre className="whitespace-pre-wrap font-mono text-xs">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 sm:text-right">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(log.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ActivityLogs; 