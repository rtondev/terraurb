import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { COMPLAINT_STATUS } from '../config/constants';

export default function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token não encontrado');
        }

        const response = await fetch(`${API_BASE_URL}/complaints?limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar denúncias');
        }

        const data = await response.json();
        setComplaints(data);
      } catch (err) {
        setError('Falha ao carregar denúncias recentes');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      [COMPLAINT_STATUS.ANALYSIS]: 'bg-yellow-100 text-yellow-800',
      [COMPLAINT_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [COMPLAINT_STATUS.VERIFICATION]: 'bg-purple-100 text-purple-800',
      [COMPLAINT_STATUS.RESOLVED]: 'bg-green-100 text-green-800',
      [COMPLAINT_STATUS.REOPENED]: 'bg-orange-100 text-orange-800',
      [COMPLAINT_STATUS.CANCELLED]: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/complaints/new"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Nova Denúncia
        </Link>
      </div>

      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900">Denúncias Recentes</h2>
          </div>
          <div className="border-t border-gray-200">
            {complaints.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {complaints.map((complaint) => (
                  <li key={complaint.id} className="p-4 hover:bg-gray-50">
                    <Link to={`/complaints/${complaint.id}`} className="block">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {complaint.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {complaint.address}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            complaint.status
                          )}`}
                        >
                          {complaint.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-center text-gray-500">
                Nenhuma denúncia encontrada
              </p>
            )}
          </div>
          {complaints.length > 0 && (
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <Link
                to="/complaints"
                className="text-sm font-medium text-green-600 hover:text-green-500"
              >
                Ver todas as denúncias →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
