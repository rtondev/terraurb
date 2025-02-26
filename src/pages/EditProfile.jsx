import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Upload, Info, Mail, MapPin, Phone, AtSign } from 'lucide-react';
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

  // Função para formatar texto com primeira letra maiúscula
  const formatCityState = (value) => {
    return value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Função para formatar número de telefone
  const formatPhoneNumber = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Formata o número
    if (limitedNumbers.length <= 2) {
      return `(${limitedNumbers}`;
    }
    if (limitedNumbers.length <= 7) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    }
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'nickname') {
      const cleanValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setForm(prev => ({ ...prev, [name]: cleanValue }));
      checkNickname(cleanValue);
    } 
    // Formatação do telefone
    else if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setForm(prev => ({ ...prev, [name]: formattedPhone }));
    }
    // Formatação de cidade e estado
    else if (name === 'city' || name === 'state') {
      const formattedValue = formatCityState(value);
      setForm(prev => ({ ...prev, [name]: formattedValue }));
    }
    // Formatação do nome completo
    else if (name === 'fullName') {
      const formattedName = formatCityState(value);
      setForm(prev => ({ ...prev, [name]: formattedName }));
    }
    else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validar nickname
    if (!form.nickname || form.nickname.length < 3) {
      setError('Nome de usuário deve ter pelo menos 3 caracteres');
      return;
    }

    if (!nicknameAvailable) {
      setError('Nome de usuário não está disponível');
      return;
    }

    try {
      setLoading(true);
      
      // Enviar dados atualizados
      const response = await api.put('/api/auth/me', {
        nickname: form.nickname,
        fullName: form.fullName,
        city: form.city,
        state: form.state,
        phone: form.phone,
        bio: form.bio
      });

      if (response.data.success) {
        setSuccess('Perfil atualizado com sucesso!');
        setTimeout(() => navigate('/configuracoes'), 2000);
      } else {
        setError('Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      setError(error.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-500">Carregando...</div>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Editar Perfil" backTo="/configuracoes" />

      <div className="flex-1 pt-16 pb-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Info Card */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Estas informações serão exibidas publicamente em seu perfil. Tenha cuidado com o que você compartilha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foto e Nome de Usuário */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Foto de Perfil</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {form.avatarUrl ? (
                      <div className="w-20 h-20 min-w-[80px] min-h-[80px] rounded-full overflow-hidden">
                        <img 
                          src={form.avatarUrl} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                          style={{
                            minWidth: '100%',
                            minHeight: '100%'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 min-w-[80px] min-h-[80px] rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-2xl">
                          {form.nickname ? form.nickname.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 p-1 bg-white rounded-full border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                      <Upload className="h-4 w-4 text-gray-600" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                      Nome de usuário
                    </label>
                    <div className="mt-1">
                      <div className="flex rounded-md border border-gray-300 focus-within:border-blue-500 transition-colors">
                        <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">
                          <AtSign className="h-4 w-4 mr-1" />
                        </span>
                        <input
                          type="text"
                          name="nickname"
                          id="nickname"
                          value={form.nickname}
                          onChange={handleChange}
                          className="block flex-1 border-0 bg-transparent py-2 pl-1 text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm"
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
                </div>
              </div>
            </div>

            {/* Informações Pessoais */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      id="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Ex: João Silva"
                      className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none transition-colors sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1 flex rounded-md border border-gray-300 bg-gray-50">
                      <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">
                        <Mail className="h-4 w-4 mr-1" />
                      </span>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={form.email}
                        disabled
                        className="block w-full border-0 bg-transparent py-2 pl-1 text-gray-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      Cidade
                    </label>
                    <div className="mt-1 flex rounded-md border border-gray-300 focus-within:border-blue-500 transition-colors">
                      <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                      </span>
                      <input
                        type="text"
                        name="city"
                        id="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Ex: São Paulo"
                        className="block w-full border-0 bg-transparent py-2 pl-1 text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Telefone
                    </label>
                    <div className="mt-1 flex rounded-md border border-gray-300 focus-within:border-blue-500 transition-colors">
                      <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">
                        <Phone className="h-4 w-4 mr-1" />
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        maxLength={15} // (XX) XXXXX-XXXX
                        className="block w-full border-0 bg-transparent py-2 pl-1 text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <div className="mt-1 flex rounded-md border border-gray-300 focus-within:border-blue-500 transition-colors">
                      <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                      </span>
                      <input
                        type="text"
                        name="state"
                        id="state"
                        value={form.state}
                        onChange={handleChange}
                        placeholder="Ex: SP"
                        maxLength={2}
                        className="block w-full border-0 bg-transparent py-2 pl-1 text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm uppercase"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Sobre
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={3}
                      value={form.bio}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none transition-colors sm:text-sm"
                      placeholder="Escreva algumas frases sobre você"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mensagens de feedback */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg flex items-center gap-2">
                <span className="text-sm">{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-lg flex items-center gap-2">
                <span className="text-sm">{success}</span>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/configuracoes')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading || !nicknameAvailable}
              >
                Salvar alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfile; 