// Vou enviar o código da página de Configurações em seguida, 
// que terá todas as opções de edição do perfil e exclusão da conta 

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Clock, 
  Laptop,
  ChevronRight, 
  AlertTriangle
} from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';

function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setProfile(response.data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      icon: User,
      color: 'blue',
      title: 'Editar Perfil',
      description: 'Atualize suas informações pessoais',
      path: '/configuracoes/perfil'
    },
    {
      icon: Clock,
      color: 'purple',
      title: 'Logs de Atividade',
      description: 'Visualize seu histórico de ações',
      path: '/configuracoes/logs'
    },
    {
      icon: Laptop,
      color: 'green',
      title: 'Dispositivos Conectados',
      description: 'Gerencie os dispositivos que têm acesso à sua conta',
      path: '/configuracoes/dispositivos'
    }
  ];

  const MenuItem = ({ item }) => (
    <Link 
      to={item.path}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-200"
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${item.color}-50`}>
              <item.icon className={`w-5 h-5 text-${item.color}-500`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <MenuItem key={index} item={item} />
          ))}
        </div>

        {error && (
          <div className="mt-6 bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Settings; 