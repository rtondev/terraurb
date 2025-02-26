import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { OSM, XYZ } from 'ol/source';
import { fromLonLat, transform } from 'ol/proj';
import Feature from 'ol/Feature';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { Draw } from 'ol/interaction';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';

function MapComponents({ 
  currentPosition, 
  selectedPosition, 
  setSelectedPosition,
  mapType,
  setMapType,
  getAddressFromCoords,
  onPolygonComplete,
  readOnly = false,
  center,
  zoom,
  onMapClick,
  onLocationSelect,
  polygonCoordinates
}) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const drawRef = useRef(null);

  useEffect(() => {
    if (!mapElement.current) return;

    // Criar fontes de dados
    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    // Criar camadas
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        fill: new Fill({
          color: 'rgba(66, 135, 245, 0.2)'
        }),
        stroke: new Stroke({
          color: '#4287f5',
          width: 2
        })
      })
    });

    const baseLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19
      })
    });

    // Criar o mapa
    const map = new Map({
      target: mapElement.current,
      layers: [baseLayer, vectorLayer],
      view: new View({
        center: fromLonLat([
          center?.lng || currentPosition?.lng || -46.6333,
          center?.lat || currentPosition?.lat || -23.5505
        ]),
        zoom: zoom || 15
      })
    });
    mapRef.current = map;

    // Adicionar interação de desenho se não for somente leitura
    if (!readOnly) {
      const draw = new Draw({
        source: vectorSource,
        type: 'Polygon'
      });

      draw.on('drawend', (event) => {
        const coords = event.feature.getGeometry().getCoordinates()[0].map(coord => 
          transform(coord, 'EPSG:3857', 'EPSG:4326')
        );
        onPolygonComplete?.(coords);
      });

      map.addInteraction(draw);
      drawRef.current = draw;
    }

    // Adicionar o polígono se houver coordenadas
    if (polygonCoordinates && polygonCoordinates.length > 0) {
      const coords = polygonCoordinates.map(coord => 
        fromLonLat([coord[0], coord[1]])
      );
      
      const polygonFeature = new Feature({
        geometry: new Polygon([coords])
      });

      vectorSource.addFeature(polygonFeature);

      // Centralizar o mapa no polígono
      const extent = polygonFeature.getGeometry().getExtent();
      map.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 1000
      });
    }

    // Atualizar evento de clique
    map.on('click', async (event) => {
      if (!readOnly && onMapClick) {
        const coords = transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
        const position = {
          lng: coords[0],
          lat: coords[1]
        };
        
        onMapClick(position);

        // Buscar endereço quando clicar no mapa
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`
          );
          const data = await response.json();
          if (data.display_name && onLocationSelect) {
            onLocationSelect(data.display_name);
          }
        } catch (error) {
          console.error('Erro ao buscar endereço:', error);
        }
      }
    });

    // Limpar ao desmontar
    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(null);
      }
    };
  }, [currentPosition, center, zoom, readOnly, polygonCoordinates]);

  // Atualizar centro do mapa quando mudar
  useEffect(() => {
    if (mapRef.current && center) {
      const view = mapRef.current.getView();
      view.animate({
        center: fromLonLat([center.lng, center.lat]),
        zoom: zoom || view.getZoom(),
        duration: 500
      });
    }
  }, [center, zoom]);

  return (
    <div className="relative">
      <div 
        ref={mapElement}
        className="h-[400px] w-full rounded-lg overflow-hidden"
      />
      {!readOnly && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            type="button"
            onClick={() => {
              if (vectorSourceRef.current) {
                vectorSourceRef.current.clear();
              }
            }}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          >
            Limpar Área
          </button>
        </div>
      )}
    </div>
  );
}

export default MapComponents; 