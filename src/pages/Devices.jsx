import React, { useState, useEffect } from 'react';
import { Laptop, Smartphone, Clock, X } from 'lucide-react';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import api from '../services/api';

function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await api.get('/api/auth/devices');
      setDevices(response.data);
    } catch (error) {
      setError('Erro ao carregar dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (sessionId) => {
    try {
      const currentToken = localStorage.getItem('@TerraurB:token');
      await api.post('/api/auth/devices/revoke', { sessionId });
      
      // Verificar se o token revogado é o atual
      const response = await api.get('/api/auth/check-session');
      if (!response.data.isActive) {
        // Se a sessão atual foi revogada, fazer logout
        localStorage.removeItem('@TerraurB:token');
        window.location.href = '/login';
        return;
      }
      
      // Se não for a sessão atual, apenas atualizar a lista
      loadDevices();
    } catch (error) {
      setError('Erro ao revogar acesso');
    }
  };

  const getDeviceIcon = (deviceInfo) => {
    if (!deviceInfo?.userAgent) {
      return <Laptop className="h-6 w-6" />;
    }

    const userAgent = deviceInfo.userAgent.toLowerCase();
    if (userAgent.includes('mobile')) {
      return <Smartphone className="h-6 w-6" />;
    }
    return <Laptop className="h-6 w-6" />;
  };

  const formatLocation = (location) => {
    if (!location) return 'Local desconhecido';
    
    const parts = [
      location.city,
      location.state,
      location.country
    ].filter(Boolean); // Remove valores vazios/null/undefined
    
    return parts.join(', ') || 'Local desconhecido';
  };

  const formatDeviceName = (deviceInfo) => {
    if (!deviceInfo) return 'Dispositivo desconhecido';
    
    const browser = deviceInfo.browser || 'Navegador desconhecido';
    const os = deviceInfo.os || 'Sistema desconhecido';
    
    return `${browser} - ${os}`;
  };

  const formatRelativeTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const deviceDate = new Date(date);
    const diffInSeconds = Math.floor((now - deviceDate) / 1000);
    
    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800) return `há ${Math.floor(diffInSeconds / 86400)} dias`;
    
    return deviceDate.toLocaleDateString();
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-white">
        <TopBar 
          title="Dispositivos Conectados" 
          backTo="/configuracoes"
        />

        <div className="flex-1 pt-14">
          <div className="max-w-3xl mx-auto">
            {/* Dispositivo Atual */}
            {devices[0] && (
              <div className="px-4 py-6">
                <h2 className="text-sm font-medium text-gray-500 mb-4">DISPOSITIVO ATUAL</h2>
                <div className="flex items-center gap-4">
                  {getDeviceIcon(devices[0].deviceInfo)}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {formatDeviceName(devices[0].deviceInfo)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatLocation(devices[0].deviceInfo?.location)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Outros Dispositivos */}
            {devices.length > 1 && (
              <div className="border-t border-gray-200">
                <h2 className="px-4 py-4 text-sm font-medium text-gray-500">OUTROS DISPOSITIVOS</h2>
                <div className="divide-y divide-gray-200">
                  {devices.slice(1).map((device) => (
                    <div key={device.id} className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        {getDeviceIcon(device.deviceInfo)}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {formatDeviceName(device.deviceInfo)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatLocation(device.deviceInfo?.location)}
                            {' • '}
                            {formatRelativeTime(device.lastUsed)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeAccess(device.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Revogar acesso"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estados de loading/erro/vazio */}
            {loading && (
              <div className="p-8 text-center text-gray-500">
                Carregando dispositivos...
              </div>
            )}

            {error && (
              <div className="p-8 text-center text-red-500">
                {error}
              </div>
            )}

            {!loading && !error && devices.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Nenhum dispositivo encontrado
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Devices; 