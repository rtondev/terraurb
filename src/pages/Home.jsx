import React, { useState } from 'react';
import Layout from '../components/Layout';
import CreateComplaintModal from '../components/CreateComplaintModal';
import { MapPin, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleComplaintSuccess = () => {
    // Aqui você pode atualizar os dados do dashboard se necessário
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Dashboard
          </h1>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-blue-600 font-medium">Total de Denúncias</h3>
            <p className="text-2xl font-bold text-blue-800">120</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-green-600 font-medium">Resolvidas</h3>
            <p className="text-2xl font-bold text-green-800">85</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-yellow-600 font-medium">Em Andamento</h3>
            <p className="text-2xl font-bold text-yellow-800">35</p>
          </div>
        </div>
      </div>

      <CreateComplaintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleComplaintSuccess}
      />
    </Layout>
  );
}

export default Home; 