import React, { useState, useEffect } from 'react';
import { Laptop, Smartphone, Clock, X, Shield, MapPin, Globe, Info } from 'lucide-react';
import TopBar from '../components/TopBar';
import api from '../services/api';

function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deviceToRevoke, setDeviceToRevoke] = useState(null);

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

  const DeviceCard = ({ device, isCurrentDevice }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 
      ${isCurrentDevice ? 'border-blue-200' : 'hover:border-gray-300'}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isCurrentDevice ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-600'}`}>
              {getDeviceIcon(device.deviceInfo)}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {formatDeviceName(device.deviceInfo)}
                {isCurrentDevice && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
                    Atual
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatRelativeTime(device.lastUsed)}
              </p>
            </div>
          </div>
          {!isCurrentDevice && (
            <button
              onClick={() => {
                setDeviceToRevoke(device);
                setShowConfirmDialog(true);
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Revogar acesso"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{formatLocation(device.deviceInfo?.location)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Globe className="h-4 w-4" />
            <span>{device.deviceInfo?.ip || 'IP desconhecido'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Diálogo de confirmação
  const ConfirmDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Confirmar revogação de acesso
          </h3>
        </div>
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja revogar o acesso deste dispositivo? Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowConfirmDialog(false)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              handleRevokeAccess(deviceToRevoke.id);
              setShowConfirmDialog(false);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Revogar acesso
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar 
        title="Dispositivos Conectados" 
        backTo="/configuracoes"
      />

      <div className="flex-1 pt-16 pb-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Info Card */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Gerencie os dispositivos que têm acesso à sua conta. Você pode revogar o acesso de dispositivos que você não reconhece.
            </p>
          </div>

          {/* Dispositivos */}
          <div className="space-y-6">
            {/* Dispositivo Atual */}
            {devices[0] && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-3">DISPOSITIVO ATUAL</h2>
                <DeviceCard device={devices[0]} isCurrentDevice={true} />
              </div>
            )}

            {/* Outros Dispositivos */}
            {devices.length > 1 && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-3">OUTROS DISPOSITIVOS</h2>
                <div className="space-y-3">
                  {devices.slice(1).map((device) => (
                    <DeviceCard key={device.id} device={device} isCurrentDevice={false} />
                  ))}
                </div>
              </div>
            )}

            {/* Estados de loading/erro/vazio */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando dispositivos...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {!loading && !error && devices.length === 0 && (
              <div className="text-center py-12">
                <Laptop className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum dispositivo encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfirmDialog && <ConfirmDialog />}
    </div>
  );
}

export default Devices; 