import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { COMPLAINT_STATUS, TAG_TYPES } from '../config/constants';

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    tag: ''
  });

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token não encontrado');
        }

        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_BASE_URL}/complaints?${queryString}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar denúncias');
        }

        const data = await response.json();
        setComplaints(data);
      } catch (err) {
        setError('Falha ao carregar denúncias');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [filters]);

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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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
        <h1 className="text-3xl font-bold text-gray-900">Denúncias</h1>
        <Link
          to="/complaints/new"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Nova Denúncia
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Todos</option>
              {Object.values(COMPLAINT_STATUS).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              id="tag"
              name="tag"
              value={filters.tag}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Todos</option>
              {Object.values(TAG_TYPES).map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="overflow-hidden">
            {complaints.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {complaints.map((complaint) => (
                  <li key={complaint.id} className="py-4">
                    <Link to={`/complaints/${complaint.id}`} className="block hover:bg-gray-50 -mx-6 px-6 py-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-lg font-medium text-gray-900">
                            {complaint.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {complaint.address}
                          </p>
                          <div className="flex gap-2">
                            {complaint.tags?.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              complaint.status
                            )}`}
                          >
                            {complaint.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Nenhuma denúncia encontrada
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
