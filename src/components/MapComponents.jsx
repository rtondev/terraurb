import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import Polygon from 'ol/geom/Polygon';
import Point from 'ol/geom/Point';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import { defaults as defaultInteractions } from 'ol/interaction';

function MapComponents({ 
  currentPosition, 
  selectedPosition, 
  mapType = 'satellite',
  onPolygonComplete,
  readOnly = false,
  center,
  zoom = 18,
  onMapClick,
  getAddressFromCoords,
  initialPolygon = null
}) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  const isValidPolygon = (polygon) => {
    return polygon && 
           Array.isArray(polygon) && 
           polygon.length >= 3 && 
           polygon.every(coord => coord && typeof coord.lat === 'number' && typeof coord.lng === 'number');
  };

  // Função para formatar endereço usando os dados estruturados do Nominatim
  const formatAddress = (addressData) => {
    if (!addressData) return '';

    // Estruturar os dados do endereço
    const address = {
      logradouro: [
        addressData.road,
        addressData.house_number
      ].filter(Boolean).join(', '),
      
      bairro: addressData.suburb || addressData.neighbourhood,
      
      cidade: addressData.city || addressData.town || addressData.village,
      
      estado: addressData.state,
      
      cep: addressData.postcode
    };

    // Formatar em linhas
    const formattedLines = [
      `Logradouro: ${address.logradouro || 'Não informado'}`,
      `Bairro: ${address.bairro || 'Não informado'}`,
      `Cidade: ${address.cidade || 'Não informada'}`,
      `Estado: ${address.estado || 'Não informado'}`,
      `CEP: ${address.cep || 'Não informado'}`
    ];

    return formattedLines.join('\n');
  };

  // Modificar a função getAddressFromCoords para usar a formatação
  const handleAddressFromCoords = async (coords) => {
    if (getAddressFromCoords) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`
        );
        const data = await response.json();
        
        if (data.address) {
          const formattedAddress = formatAddress(data.address);
          return formattedAddress;
        }
      } catch (error) {
        console.error('Erro ao obter endereço:', error);
      }
    }
  };

  useEffect(() => {
    if (!mapElement.current) return;

    // Configurar camada de satélite
    const satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19,
        crossOrigin: 'anonymous'
      })
    });

    // Criar fonte de vetores
    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    // Criar camada de vetores
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        fill: new Fill({
          color: 'rgba(59, 130, 246, 0.2)'
        }),
        stroke: new Stroke({
          color: '#3b82f6',
          width: 2
        })
      })
    });

    // Determinar o centro do mapa
    let mapCenter;
    if (isValidPolygon(initialPolygon)) {
      const sumCoords = initialPolygon.reduce((acc, coord) => ({
        lng: acc.lng + coord.lng,
        lat: acc.lat + coord.lat
      }), { lng: 0, lat: 0 });
      
      mapCenter = fromLonLat([
        sumCoords.lng / initialPolygon.length,
        sumCoords.lat / initialPolygon.length
      ]);
    } else {
      mapCenter = center ? 
        fromLonLat([center.lng, center.lat]) : 
        currentPosition ? 
          fromLonLat([currentPosition.lng, currentPosition.lat]) : 
          fromLonLat([-47.9292, -15.7801]);
    }

    // Criar mapa
    const map = new Map({
      target: mapElement.current,
      layers: [satelliteLayer, vectorLayer],
      view: new View({
        center: mapCenter,
        zoom: zoom,
        maxZoom: 19
      }),
      interactions: defaultInteractions({
        doubleClickZoom: false
      })
    });

    mapRef.current = map;

    // Adicionar polígono inicial se existir e for válido
    if (isValidPolygon(initialPolygon)) {
      try {
        const coords = initialPolygon.map(coord => 
          fromLonLat([coord.lng, coord.lat])
        );
        
        const polygonFeature = new Feature({
          geometry: new Polygon([coords])
        });
        
        vectorSource.addFeature(polygonFeature);

        // Ajustar view para mostrar todo o polígono
        const extent = polygonFeature.getGeometry().getExtent();
        if (extent && extent.length === 4) {
          map.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            maxZoom: 19
          });
        }
      } catch (error) {
        console.error('Erro ao adicionar polígono:', error);
      }
    }

    // Adicionar interação de desenho se não for somente leitura
    if (!readOnly) {
      const draw = new Draw({
        source: vectorSource,
        type: 'Polygon'
      });

      draw.on('drawstart', () => {
        vectorSource.clear();
        setDrawing(true);
      });

      draw.on('drawend', (event) => {
        setDrawing(false);
        const coords = event.feature.getGeometry().getCoordinates()[0];
        const lonLatCoords = coords.map(coord => {
          const lonLat = toLonLat(coord);
          return { lng: lonLat[0], lat: lonLat[1] };
        });
        
        if (onPolygonComplete) {
          onPolygonComplete(lonLatCoords);
        }
      });

      drawRef.current = draw;
      map.addInteraction(draw);

      // Adicionar interação de modificação
      const modify = new Modify({
        source: vectorSource
      });

      modify.on('modifyend', () => {
        const features = vectorSource.getFeatures();
        if (features.length > 0) {
          const coords = features[0].getGeometry().getCoordinates()[0];
          const lonLatCoords = coords.map(coord => {
            const lonLat = toLonLat(coord);
            return { lng: lonLat[0], lat: lonLat[1] };
          });
          
          if (onPolygonComplete) {
            onPolygonComplete(lonLatCoords);
          }
        }
      });

      map.addInteraction(modify);
    }

    // Adicionar marcador de posição atual/selecionada
    if (currentPosition || selectedPosition) {
      const position = selectedPosition || currentPosition;
      const positionFeature = new Feature({
        geometry: new Point(fromLonLat([position.lng, position.lat]))
      });

      positionFeature.setStyle(new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({
            color: '#3b82f6'
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 2
          })
        })
      }));

      vectorSource.addFeature(positionFeature);
    }

    // Adicionar handler de clique no mapa
    if (onMapClick && !readOnly) {
      map.on('click', async (event) => {
        if (!drawing) {
          const coords = toLonLat(event.coordinate);
          const clickCoords = { lng: coords[0], lat: coords[1] };
          onMapClick(clickCoords);
          if (getAddressFromCoords) {
            const formattedAddress = await handleAddressFromCoords(clickCoords);
            if (formattedAddress) {
              getAddressFromCoords(clickCoords, formattedAddress);
            }
          }
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
      }
    };
  }, [currentPosition, selectedPosition, mapType, center, zoom, readOnly, initialPolygon]);

  return (
    <div 
      ref={mapElement} 
      className="w-full h-[400px] rounded-lg overflow-hidden"
      style={{ background: '#f3f4f6' }}
    />
  );
}

export default MapComponents;