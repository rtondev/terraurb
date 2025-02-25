import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.get('/api/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Erro ao carregar denúncias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    try {
      await api.patch(`/api/reports/${id}/review`, { status });
      loadReports();
    } catch (error) {
      console.error('Erro ao revisar denúncia:', error);
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">Denúncias de Conteúdo</h1>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => (
              <div key={report.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium text-gray-900">
                        {report.type === 'complaint' ? 'Denúncia' : 'Comentário'}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-600">{report.reason}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      Reportado em: {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(report.id, 'inappropriate')}
                        className="text-red-500 hover:text-red-600"
                      >
                        <XCircle className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => handleReview(report.id, 'dismissed')}
                        className="text-green-500 hover:text-green-600"
                      >
                        <CheckCircle className="h-6 w-6" />
                      </button>
                    </div>
                  )}
                  {report.status !== 'pending' && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
                      ${report.status === 'inappropriate' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {report.status === 'inappropriate' ? 'Inapropriado' : 'Descartado'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Reports; 