// Vou enviar o código da página de Configurações em seguida, 
// que terá todas as opções de edição do perfil e exclusão da conta 

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Shield, AlertTriangle, Clock, Trash2, ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';

function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/api/me');
      setProfile(response.data);
      setEditForm(response.data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.put('/api/me', editForm);
      setProfile(response.data);
      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao atualizar perfil');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/api/me');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      setError('Erro ao deletar conta');
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto min-h-screen border-x border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Configurações</h1>
          </div>
        </div>

        {/* Menu de Configurações */}
        <div className="divide-y divide-gray-200">
          {/* Editar Perfil */}
          <Link 
            to="/configuracoes/perfil"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-full">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Editar Perfil</h3>
                <p className="text-sm text-gray-500">Atualize suas informações pessoais</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          {/* Logs de Atividade */}
          <Link 
            to="/configuracoes/logs"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-full">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Logs de Atividade</h3>
                <p className="text-sm text-gray-500">Visualize seu histórico de ações</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </div>
    </Layout>
  );
}

export default Settings; 