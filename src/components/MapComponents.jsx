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
import { Draw, Modify, Snap } from 'ol/interaction';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { unByKey } from 'ol/Observable';

function MapComponents({ 
  currentPosition, 
  selectedPosition, 
  setSelectedPosition, 
  mapType, 
  setMapType,
  getAddressFromCoords,
  onPolygonComplete,
  readOnly = false,
  polygonCoordinates = null
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const drawInteractionRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const locationSourceRef = useRef(null);

  useEffect(() => {
    console.log('Coordenadas recebidas:', polygonCoordinates); // Debug
    console.log('Posição atual:', currentPosition); // Debug

    // Fonte para o polígono
    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    // Fonte para o ponto de localização
    const locationSource = new VectorSource();
    locationSourceRef.current = locationSource;

    // Configurar camadas e mapa
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        fill: new Fill({
          color: 'rgba(66, 135, 245, 0.2)'
        }),
        stroke: new Stroke({
          color: '#4287f5',
          width: 2
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#4287f5'
          })
        })
      })
    });

    const locationLayer = new VectorLayer({
      source: locationSource,
      style: new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: '#3B82F6' }),
          stroke: new Stroke({ 
            color: '#ffffff',
            width: 2
          })
        })
      }),
      zIndex: 2
    });

    const satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19
      })
    });

    // Criar o mapa
    const map = new Map({
      target: mapRef.current,
      layers: [satelliteLayer, vectorLayer, locationLayer],
      view: new View({
        center: fromLonLat([
          currentPosition?.lng || -46.6333,
          currentPosition?.lat || -23.5505
        ]),
        zoom: 19
      })
    });
    mapInstanceRef.current = map;

    // Atualizar ponto de localização
    if (currentPosition) {
      const locationFeature = new Feature({
        geometry: new Point(transform(
          [currentPosition.lng, currentPosition.lat],
          'EPSG:4326',
          'EPSG:3857'
        ))
      });
      locationSource.addFeature(locationFeature);

      // Centralizar no ponto atual
      map.getView().setCenter(transform(
        [currentPosition.lng, currentPosition.lat],
        'EPSG:4326',
        'EPSG:3857'
      ));
    }

    // Se estiver em modo somente leitura, mostrar o polígono salvo
    if (readOnly && polygonCoordinates) {
      try {
        console.log('Tentando desenhar polígono com coordenadas:', polygonCoordinates);
        
        // Garantir que as coordenadas estão no formato correto
        let coords;
        if (typeof polygonCoordinates === 'string') {
          coords = JSON.parse(polygonCoordinates);
        } else {
          coords = polygonCoordinates;
        }

        if (Array.isArray(coords)) {
          const transformedCoords = coords.map(coord => {
            if (Array.isArray(coord) && coord.length >= 2) {
              return transform([coord[0], coord[1]], 'EPSG:4326', 'EPSG:3857');
            }
            return null;
          }).filter(coord => coord !== null);

          if (transformedCoords.length >= 3) {
            const polygon = new Feature({
              geometry: new Polygon([transformedCoords])
            });
            
            polygon.setStyle(new Style({
              fill: new Fill({
                color: 'rgba(66, 135, 245, 0.3)'
              }),
              stroke: new Stroke({
                color: '#4287f5',
                width: 3
              })
            }));

            vectorSource.addFeature(polygon);

            // Centralizar no polígono
            const extent = polygon.getGeometry().getExtent();
            map.getView().fit(extent, {
              padding: [50, 50, 50, 50],
              maxZoom: 19,
              duration: 1000
            });
          }
        }
      } catch (error) {
        console.error('Erro ao processar coordenadas do polígono:', error);
      }
    } else if (!readOnly) {
      // Modo de edição - permitir desenho do polígono
      const draw = new Draw({
        source: vectorSource,
        type: 'Polygon'
      });

      draw.on('drawend', (event) => {
        const feature = event.feature;
        const polygon = feature.getGeometry();
        const coordinates = polygon.getCoordinates()[0].map(coord => 
          transform(coord, 'EPSG:3857', 'EPSG:4326')
        );
        
        console.log('Coordenadas desenhadas:', coordinates); // Debug
        if (onPolygonComplete) {
          onPolygonComplete(coordinates);
        }

        // Reiniciar o desenho automaticamente
        setTimeout(() => {
          map.addInteraction(draw);
        }, 100);
      });

      map.addInteraction(draw);
      drawInteractionRef.current = draw;
    }

    return () => {
      map.setTarget(null);
    };
  }, [currentPosition, readOnly, polygonCoordinates]);

  // Função para limpar o desenho (apenas no modo edição)
  const clearDrawing = () => {
    if (!readOnly && vectorSourceRef.current) {
      vectorSourceRef.current.clear();
    }
  };

  return (
    <>
      {!readOnly && (
        <div className="bg-gray-50 p-2 border-b border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={clearDrawing}
            className="px-3 py-1 rounded text-sm bg-red-500 text-white hover:bg-red-600"
          >
            Limpar Área
          </button>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        style={{ height: readOnly ? '300px' : '400px' }}
        className="w-full"
      />
    </>
  );
}

export default MapComponents; 