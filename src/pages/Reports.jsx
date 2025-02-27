import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import ReportButton from '../components/ReportButton';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.get('/api/reports');
      setReports(response.data);
      setError('');
    } catch (error) {
      console.error('Erro ao carregar denúncias:', error);
      setError('Erro ao carregar denúncias');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId, action) => {
    try {
      setLoading(true);
      await api.patch(`/api/reports/${reportId}`, {
        status: action,
        adminNote: action === 'resolved' ? 'Conteúdo removido' : 'Denúncia rejeitada'
      });
      
      await loadReports();
      setError('');
    } catch (error) {
      console.error('Erro ao resolver denúncia:', error);
      setError('Erro ao resolver denúncia');
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (report) => {
    if (report.type === 'comment') {
      return (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Autor: {report.content.author}</span>
            <span>{new Date(report.content.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-gray-700 font-medium">{report.content.text}</p>
          <p className="text-sm text-gray-500">{report.content.context}</p>
          <div className="flex justify-end">
            <ReportButton 
              type="comment"
              targetId={report.targetId}
              userId={report.content.authorId}
              contentRef={{
                complaintId: report.content.complaintId,
                content: report.content.text
              }}
            />
          </div>
        </div>
      );
    }
    
    if (report.type === 'complaint') {
      return (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Autor: {report.content.author}</span>
            <span>{new Date(report.content.createdAt).toLocaleDateString()}</span>
          </div>
          <h4 className="font-medium text-gray-900">{report.content.title}</h4>
          <p className="text-gray-700">{report.content.description}</p>
          <div className="flex justify-end">
            <ReportButton 
              type="complaint"
              targetId={report.targetId}
              userId={report.content.authorId}
              contentRef={{
                content: report.content.title,
                description: report.content.description
              }}
            />
          </div>
        </div>
      );
    }

    if (report.type === 'report') {
      return (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Autor: {report.content.author}</span>
            <span>{new Date(report.content.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-gray-700">{report.content.text}</p>
          <div className="flex justify-end">
            <ReportButton 
              type="report"
              targetId={report.targetId}
              userId={report.content.authorId}
              contentRef={{
                content: report.content.text,
                originalType: report.content.originalType
              }}
            />
          </div>
        </div>
      );
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Denúncias Pendentes</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-500">Carregando...</p>
            </div>
          ) : reports.length === 0 ? (
            <p className="text-gray-500">Não há denúncias pendentes.</p>
          ) : (
            reports.map(report => (
              <div key={report.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        Reportado por {report.reporter.nickname}
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        {report.type === 'comment' ? 'Comentário' : report.type === 'complaint' ? 'Denúncia' : 'Denúncia de Denúncia'}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-900">{report.reason}</p>
                    {formatContent(report)}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleResolve(report.id, 'resolved')}
                      disabled={loading}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      Remover Conteúdo
                    </button>
                    <button
                      onClick={() => handleResolve(report.id, 'rejected')}
                      disabled={loading}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Reports; 