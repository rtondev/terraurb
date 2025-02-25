import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { Clock, ArrowRight } from 'lucide-react';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await api.get('/api/complaints');
      const complaintsWithLogs = response.data.filter(c => c.ComplaintLogs?.length > 0);
      setLogs(complaintsWithLogs.flatMap(c => 
        c.ComplaintLogs.map(log => ({
          ...log,
          complaintDescription: c.description
        }))
      ));
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">Histórico de Alterações</h1>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {logs.map((log) => (
              <div key={log.id} className="p-6">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-gray-900">{log.complaintDescription}</p>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-gray-500">{log.oldStatus}</span>
                      <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                      <span className="font-medium text-gray-900">{log.newStatus}</span>
                    </div>
                    {log.changedBy && (
                      <p className="mt-1 text-sm text-gray-500">
                        Alterado por: {log.changedBy.nickname}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Logs; 