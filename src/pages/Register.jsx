import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Check, X } from 'lucide-react';
import api from '../services/api';

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: username, 2: email/password, 3: verification
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  // Adiciona um debounce para a verificação do nickname
  const [debouncedCheckNickname] = useState(() => {
    let timeoutId;
    return (value) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => checkNicknameAvailability(value), 500);
    };
  });

  // Função para verificar disponibilidade do nickname
  const checkNicknameAvailability = async (value) => {
    if (value.length < 3) {
      setNicknameAvailable(false);
      return;
    }

    setIsCheckingNickname(true);
    try {
      const response = await api.get(`/api/auth/check-nickname/${value}`);
      setNicknameAvailable(response.data.available);
    } catch (error) {
      console.error('Erro ao verificar nickname:', error);
      setNicknameAvailable(false);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleNicknameChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setNickname(value);
    
    // Limpa o status de disponibilidade enquanto digita
    setNicknameAvailable(null);
    
    // Só verifica após ter pelo menos 3 caracteres
    if (value.length >= 3) {
      debouncedCheckNickname(value);
    } else {
      setNicknameAvailable(false);
    }
  };

  const handleNextStep = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (step === 1) {
        if (!nicknameAvailable || nickname.length < 3) {
          setError('Por favor, escolha um nome de usuário válido');
          setLoading(false);
          return;
        }
        setStep(2);
      } else if (step === 2) {
        if (!email || !password) {
          setError('Email e senha são obrigatórios');
          setLoading(false);
          return;
        }

        try {
          const response = await api.post('/api/auth/send-verification-code', { 
            email,
            nickname
          });
          
          if (response.data.success) {
            setStep(3);
          } else {
            setError('Erro ao enviar código de verificação');
          }
        } catch (error) {
          console.error('Erro ao enviar código:', error);
          setError(error.response?.data?.error || 'Erro ao enviar código. Por favor, tente novamente.');
        }
      }
    } catch (error) {
      console.error('Erro no processo:', error);
      setError(error.response?.data?.error || 'Erro ao prosseguir. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Enviando dados para verificação:', {
        email,
        code: verificationCode,
        nickname
      });

      // Primeiro verifica o código
      const verifyResponse = await api.post('/api/auth/verify-code', { 
        email, 
        code: verificationCode,
        nickname
      });

      console.log('Resposta da verificação:', verifyResponse.data);

      if (!verifyResponse.data.verified) {
        setError('Código inválido');
        setLoading(false);
        return;
      }

      // Se o código for válido, tenta registrar
      const registerResponse = await api.post('/api/auth/register', {
        nickname,
        email,
        password,
        verificationCode
      });

      if (registerResponse.data.success) {
        navigate('/login', { 
          state: { message: 'Conta criada com sucesso! Faça login para continuar.' }
        });
      } else {
        setError('Erro ao criar conta. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao completar o registro';
      console.log('Mensagem de erro:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      console.log('Reenviando código para:', email);
      const response = await api.post('/api/auth/send-verification-code', { 
        email,
        nickname // Incluir nickname aqui também
      });

      if (response.data.success) {
        // Mostrar mensagem de sucesso temporária
        const successMessage = document.createElement('div');
        successMessage.className = 'text-green-500 text-sm mt-2';
        successMessage.textContent = 'Código reenviado com sucesso!';
        document.querySelector('form').appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);
      }
    } catch (error) {
      console.error('Erro ao reenviar:', error);
      setError(error.response?.data?.error || 'Erro ao reenviar código');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">
          {step === 1 ? 'Nome de usuário' : step === 2 ? 'Credenciais' : 'Verificação'}
        </span>
        <span className="text-sm font-medium text-gray-600">
          Passo {step} de 3
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div 
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-500 text-white p-12 flex-col justify-between">
        <div>
          <img src="/logo.svg" alt="TerraUrb Logo" className="h-12 mb-8" />
          <h2 className="text-4xl font-bold mb-4">
            Crie sua conta no TerraUrb
          </h2>
          <p className="text-lg opacity-90">
            Junte-se a nós para ajudar a manter sua cidade mais limpa e organizada.
            Denuncie terrenos baldios e acompanhe as resoluções.
          </p>
        </div>
        <div className="text-sm opacity-75">
          © 2024 TerraUrb. Todos os direitos reservados.
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <img src="/logo.svg" alt="TerraUrb Logo" className="h-12 mx-auto" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Criar conta
          </h1>
          <p className="text-gray-600 mb-8">
            Preencha seus dados para se cadastrar
          </p>

          {renderProgressBar()}

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={nickname}
                  onChange={handleNicknameChange}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 outline-none transition-colors
                    ${nickname.length < 3 ? 'border-gray-300' :
                      isCheckingNickname ? 'border-gray-300' : 
                      nicknameAvailable ? 'border-green-500 focus:ring-green-200' : 
                      nicknameAvailable === false ? 'border-red-500 focus:ring-red-200' :
                      'border-gray-300 focus:ring-blue-500'}`}
                  placeholder="Nome de usuário"
                  required
                  minLength={3}
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingNickname ? (
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent" />
                  ) : nickname.length >= 3 && nicknameAvailable !== null && (
                    nicknameAvailable ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )
                  )}
                </div>
              </div>

              {nickname.length > 0 && nickname.length < 3 && (
                <p className="text-sm text-red-500">
                  O nome de usuário deve ter pelo menos 3 caracteres
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !nicknameAvailable || isCheckingNickname || nickname.length < 3}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          ) : step === 2 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Senha"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/2 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-1/2 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Continuar'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Enviamos um código de verificação para {email}
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Digite o código"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/2 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-1/2 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verificando...' : 'Criar conta'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="w-full text-blue-500 py-2 text-sm hover:underline disabled:opacity-50"
              >
                {loading ? 'Reenviando...' : 'Reenviar código'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-blue-500 font-medium hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register; 