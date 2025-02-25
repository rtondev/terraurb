import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { Plus, Edit2, Trash2 } from 'lucide-react';

function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await api.get('/api/tags');
      setTags(response.data);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/tags', { name: newTag });
      setNewTag('');
      loadTags();
    } catch (error) {
      console.error('Erro ao criar tag:', error);
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">Tags</h1>
          <form onSubmit={handleCreateTag} className="mt-4 flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Nova tag"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Adicionar
            </button>
          </form>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{tag.name}</span>
                <div className="flex gap-2">
                  <button className="text-blue-500 hover:text-blue-600">
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Tags; 