import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag as TagIcon, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';

function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await api.get('/api/tags');
      setTags(response.data);
    } catch (error) {
      setError('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/tags', { name: newTag });
      setNewTag('');
      loadTags();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao criar tag');
    }
  };

  const handleUpdateTag = async (id, newName) => {
    setError('');
    try {
      await api.put(`/api/tags/${id}`, { name: newName });
      setEditingTag(null);
      loadTags();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao atualizar tag');
    }
  };

  const handleDeleteTag = async (id) => {
    setError('');
    try {
      await api.delete(`/api/tags/${id}`);
      setShowConfirmDelete(null);
      loadTags();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao deletar tag');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">Tags</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerencie as tags utilizadas nas denúncias
            </p>

            {/* Form */}
            <form onSubmit={handleCreateTag} className="mt-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Nova tag"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Adicionar
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Lista de Tags */}
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tags.map((tag) => (
                <div key={tag.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {editingTag?.id === tag.id ? (
                        <input
                          type="text"
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                          className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onBlur={() => handleUpdateTag(tag.id, editingTag.name)}
                          onKeyPress={(e) => e.key === 'Enter' && handleUpdateTag(tag.id, editingTag.name)}
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">{tag.name}</span>
                          <span className="text-sm text-gray-500">
                            {tag.complaintCount} denúncias
                          </span>
                          <span className="text-xs text-gray-400">
                            Criada em {formatDate(tag.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingTag({ id: tag.id, name: tag.name })}
                        className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowConfirmDelete(tag.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Confirmação de exclusão */}
                  {showConfirmDelete === tag.id && (
                    <div className="mt-2 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600 mb-2">
                        Tem certeza que deseja excluir esta tag?
                      </p>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowConfirmDelete(null)}
                          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {tags.length === 0 && (
                <div className="p-6 text-center">
                  <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma tag cadastrada</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Tags; 