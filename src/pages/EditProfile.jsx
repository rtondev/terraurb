import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, MapPin, Calendar, ArrowLeft, Save } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';

function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setEditForm(response.data);
    } catch (error) {
      setError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/auth/me', editForm);
      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => navigate('/perfil'), 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao atualizar perfil');
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto min-h-screen border-x border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/configuracoes')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold">Editar Perfil</h1>
            </div>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </button>
          </div>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 text-green-600 border-b border-green-100">
            {success}
          </div>
        )}

        {/* Banner e Avatar */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <div className="absolute -bottom-16 left-4">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-white flex items-center justify-center">
              <User className="w-16 h-16 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="px-4 pt-20 pb-4">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome de Usuário
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">@</span>
                <input
                  type="text"
                  value={editForm.nickname || ''}
                  onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  className="flex-1 px-3 py-2 border-b border-gray-300 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={editForm.email || ''}
                disabled
                className="w-full px-3 py-2 border-b border-gray-200 bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={editForm.fullName || ''}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Idade
              </label>
              <input
                type="number"
                value={editForm.age || ''}
                onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                value={editForm.bio || ''}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none transition-colors resize-none"
                placeholder="Conte um pouco sobre você..."
              />
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default EditProfile; 