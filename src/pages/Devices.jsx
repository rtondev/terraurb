import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, Globe, Clock } from 'lucide-react';
import Layout from '../components/Layout';
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

  const getDeviceIcon = (deviceInfo) => {
    if (!deviceInfo) return <Monitor className="h-5 w-5" />;
    
    switch (deviceInfo.type) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const formatLocation = (location) => {
    if (!location) return 'Localização desconhecida';
    
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.region) parts.push(location.region);
    if (location.country) parts.push(location.country);
    
    return parts.join(', ') || 'Localização desconhecida';
  };

  const formatDeviceName = (device) => {
    const browser = device.browser?.name || 'Navegador desconhecido';
    const os = device.os?.name || 'Sistema desconhecido';
    const version = device.browser?.version;
    
    return `${browser} ${version || ''} em ${os}`;
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
    
    return deviceDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">
              Dispositivos Conectados
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Lista de dispositivos que acessaram sua conta
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {devices.map((device) => (
                <div 
                  key={device.id}
                  className={`p-4 ${device.current ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getDeviceIcon(device.device)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {formatDeviceName(device)}
                        </span>
                        {device.current && (
                          <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                            Sessão atual
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          {formatLocation(device.location)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatRelativeTime(device.lastActivity)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Devices; 