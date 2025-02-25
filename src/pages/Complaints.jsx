import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { MapPin, Clock, Tag, Plus, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await api.get('/api/complaints');
      setComplaints(response.data);
    } catch (error) {
      console.error('Erro ao carregar denúncias:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-800">Denúncias</h1>
            </div>
            <Link
              to="/denuncias/nova"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <Plus className="h-4 w-4" />
                <span>Nova Denúncia</span>
              </div>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {complaint.description}
                    </h2>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      {complaint.location}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </div>
                    {complaint.Tags && complaint.Tags.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <div className="flex gap-2">
                          {complaint.Tags.map(tag => (
                            <span key={tag.id} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
                      ${complaint.status === 'Resolvido' ? 'bg-green-100 text-green-800' : 
                      complaint.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-blue-100 text-blue-800'}`}>
                      {complaint.status}
                    </span>
                    <button
                      onClick={() => navigate(`/denuncias/${complaint.id}`)}
                      className="flex items-center text-blue-500 hover:text-blue-600 text-sm font-medium"
                    >
                      Ver Detalhes
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
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

export default Complaints; 