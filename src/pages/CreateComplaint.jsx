import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronLeft, Crosshair, Search } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';

// Importação dinâmica dos componentes do mapa
const MapComponents = React.lazy(() => import('../components/MapComponents'));

function CreateComplaint() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPosition, setCurrentPosition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [mapType, setMapType] = useState('streets'); // 'streets' ou 'satellite'
  const [polygonCoordinates, setPolygonCoordinates] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(15);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    loadTags();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentPosition(pos);
          setSelectedPosition(pos);
          setMapCenter(pos);
          setMapZoom(18);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
        }
      );
    }
  };

  const getAddressFromCoords = async (coords) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
      );
      const data = await response.json();
      if (data.display_name) {
        setLocation(data.display_name);
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
    }
  };

  const loadTags = async () => {
    try {
      const response = await api.get('/api/tags');
      setAvailableTags(response.data);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    }
  };

  const handlePolygonComplete = (coordinates) => {
    console.log('Polígono completado:', coordinates); // Debug
    setPolygonCoordinates(coordinates);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = {
      title,
      description,
      location,
      tagIds: selectedTags,
      polygonCoordinates
    };

    console.log('Enviando dados:', data);

    try {
      const response = await api.post('/api/complaints', data);
      console.log('Resposta:', response.data);
      navigate('/denuncias');
    } catch (error) {
      console.error('Erro completo:', error);
      setError(error.response?.data?.message || 'Erro ao criar denúncia');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setLocation(e.target.value);
    setIsTyping(true);
  };

  const handleSelectAddress = (result) => {
    const position = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
    
    setLocation(result.display_name);
    setSelectedPosition(position);
    setMapCenter(position);
    setMapZoom(18);
    setSearchResults([]);
    setIsTyping(false);
  };

  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br&addressdetails=1`
      );
      const data = await response.json();
      
      const filteredResults = data.filter(result => 
        result.type === 'house' || 
        result.type === 'street' || 
        result.type === 'residential'
      );
      
      setSearchResults(filteredResults.length > 0 ? filteredResults : data);
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAddress(location);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [location]);

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow">
        {/* Header com Breadcrumb */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>Denúncias</span>
                <ChevronLeft className="h-4 w-4" />
                <span>Nova Denúncia</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-800">
                Registrar Nova Denúncia
              </h1>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 max-w-3xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite um título breve para a denúncia..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Descreva detalhadamente o problema encontrado..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localização
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={location}
                    onChange={handleInputChange}
                    onFocus={() => setIsTyping(true)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o endereço ou clique no mapa"
                    required
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600"
                    title="Usar minha localização atual"
                  >
                    <Crosshair className="h-5 w-5" />
                  </button>

                  {isTyping && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectAddress(result)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-start gap-2"
                        >
                          <Search className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {result.display_name.split(',')[0]}
                            </div>
                            <div className="text-xs text-gray-500">
                              {result.display_name.split(',').slice(1).join(',')}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {isSearching && (
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Suspense fallback={
                    <div className="h-[300px] flex items-center justify-center bg-gray-50">
                      <div className="text-gray-500">Carregando mapa...</div>
                    </div>
                  }>
                    <MapComponents
                      currentPosition={currentPosition}
                      selectedPosition={selectedPosition}
                      setSelectedPosition={setSelectedPosition}
                      mapType="satellite"
                      setMapType={setMapType}
                      getAddressFromCoords={getAddressFromCoords}
                      onPolygonComplete={handlePolygonComplete}
                      readOnly={false}
                      center={mapCenter}
                      zoom={mapZoom}
                      onMapClick={(coords) => {
                        setSelectedPosition(coords);
                        getAddressFromCoords(coords);
                      }}
                      onLocationSelect={(address) => setLocation(address)}
                    />
                  </Suspense>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorias
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <label
                    key={tag.id}
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm cursor-pointer transition-colors
                      ${selectedTags.includes(tag.id)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedTags.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTags([...selectedTags, tag.id]);
                        } else {
                          setSelectedTags(selectedTags.filter(id => id !== tag.id));
                        }
                      }}
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Registrar Denúncia'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default CreateComplaint; 