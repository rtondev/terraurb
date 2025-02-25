import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Upload } from 'lucide-react';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import api from '../services/api';

function EditProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nickname: '',
    email: '',
    fullName: '',
    city: '',
    state: '',
    age: '',
    phone: '',
    bio: '',
    avatarUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(true);
  const [originalNickname, setOriginalNickname] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setForm({
        nickname: response.data.nickname || '',
        email: response.data.email || '',
        fullName: response.data.fullName || '',
        city: response.data.city || '',
        state: response.data.state || '',
        age: response.data.age || '',
        phone: response.data.phone || '',
        bio: response.data.bio || '',
        avatarUrl: response.data.avatarUrl || ''
      });
      setOriginalNickname(response.data.nickname || '');
      setLoading(false);
    } catch (error) {
      setError('Erro ao carregar perfil');
      setLoading(false);
    }
  };

  const checkNickname = async (nickname) => {
    if (nickname === originalNickname) {
      setNicknameAvailable(true);
      return;
    }

    setIsCheckingNickname(true);
    try {
      const response = await api.get(`/api/auth/check-nickname/${nickname}`);
      setNicknameAvailable(response.data.available);
    } catch (error) {
      console.error('Erro ao verificar nickname:', error);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/api/auth/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setForm(prev => ({ ...prev, avatarUrl: response.data.avatarUrl }));
      setSuccess('Foto atualizada com sucesso!');
    } catch (error) {
      setError('Erro ao fazer upload da foto');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (name === 'nickname') {
      checkNickname(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.put('/api/auth/me', form);
      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => navigate('/configuracoes'), 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao atualizar perfil');
    }
  };

  // Estilo base para todos os inputs
  const inputClassName = "block w-full rounded-md border border-gray-300 py-2 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none transition-colors sm:text-sm";

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-white">
        <TopBar title="Editar Perfil" backTo="/configuracoes" />

        <div className="flex-1 pt-14">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-12 px-4 py-6">
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold leading-7 text-gray-900">Perfil</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Estas informações serão exibidas publicamente, então tenha cuidado com o que você compartilha.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="nickname" className="block text-sm font-medium text-gray-900">
                    Nome de usuário
                  </label>
                  <div className="mt-2">
                    <div className="flex rounded-md border border-gray-300 focus-within:border-blue-500 focus-within:outline-none transition-colors">
                      <span className="flex select-none items-center pl-4 text-gray-500 sm:text-sm">
                        terraurb.com/
                      </span>
                      <input
                        type="text"
                        name="nickname"
                        id="nickname"
                        value={form.nickname}
                        onChange={handleChange}
                        className="block flex-1 border-0 bg-transparent py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm"
                      />
                    </div>
                    {isCheckingNickname && (
                      <p className="mt-1 text-sm text-gray-500">Verificando disponibilidade...</p>
                    )}
                    {!isCheckingNickname && !nicknameAvailable && (
                      <p className="mt-1 text-sm text-red-500">Este nome de usuário já está em uso</p>
                    )}
                  </div>
                </div>

                <div className="col-span-full">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-900">
                    Sobre
                  </label>
                  <div className="mt-2">
                    <textarea
                      id="bio"
                      name="bio"
                      rows={3}
                      value={form.bio}
                      onChange={handleChange}
                      className={inputClassName}
                      placeholder="Escreva algumas frases sobre você"
                    />
                  </div>
                </div>

                <div className="col-span-full">
                  <label htmlFor="photo" className="block text-sm font-medium text-gray-900">
                    Foto de perfil
                  </label>
                  <div className="mt-2 flex items-center gap-x-3">
                    {form.avatarUrl ? (
                      <img src={form.avatarUrl} alt="Avatar" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-gray-300" />
                    )}
                    <label className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 cursor-pointer transition-colors">
                      Alterar foto
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold leading-7 text-gray-900">Informações Pessoais</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Utilize um endereço onde você possa receber correspondências.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-900">
                    Nome Completo
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="fullName"
                      id="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                    Email
                  </label>
                  <div className="mt-2">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={form.email}
                      disabled
                      className="block w-full rounded-md border border-gray-300 bg-gray-50 py-2 px-4 text-gray-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-900">
                    Cidade
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={form.city}
                      onChange={handleChange}
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="state" className="block text-sm font-medium text-gray-900">
                    Estado
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="state"
                      id="state"
                      value={form.state}
                      onChange={handleChange}
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-900">
                    Telefone
                  </label>
                  <div className="mt-2">
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mensagens de erro/sucesso */}
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            {success && (
              <div className="text-green-600 text-sm">{success}</div>
            )}

            {/* Botões de ação */}
            <div className="mt-6 flex items-center justify-end gap-x-6">
              <button
                type="button"
                onClick={() => navigate('/configuracoes')}
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                disabled={loading}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default EditProfile; 