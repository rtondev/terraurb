import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, User } from 'lucide-react';
import Layout from '../components/Layout';
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
      const response = await api.get('/api/admin/activity-logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      setError('Erro ao carregar histórico de atividades');
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
    return new Date(date).toLocaleString('pt-BR', options);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Histórico de Atividades
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar do usuário */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm overflow-hidden">
                      {log.user?.avatarUrl ? (
                        <img 
                          src={log.user.avatarUrl} 
                          alt={log.user.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Conteúdo do log */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link 
                        to={`/perfil/${log.user?.nickname}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {log.user?.nickname}
                      </Link>
                      <span className="text-xs text-gray-500">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>

                    <p className="text-gray-600">{log.action}</p>

                    {log.details && (
                      <div className="mt-2 text-sm text-gray-500">
                        <pre className="whitespace-pre-wrap font-sans">
                          {log.details}
                        </pre>
                      </div>
                    )}

                    {log.complaintId && (
                      <Link
                        to={`/denuncias/${log.complaintId}`}
                        className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        Ver denúncia
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Nenhuma atividade
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Não há registros de atividade para mostrar.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ActivityLogs; 