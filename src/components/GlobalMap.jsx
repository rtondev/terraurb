import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';
import { fromLonLat, transform } from 'ol/proj';
import Feature from 'ol/Feature';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import Polygon from 'ol/geom/Polygon';
import { Map as MapIcon, Layers, MapPin } from 'lucide-react';
import Point from 'ol/geom/Point';

function GlobalMap({ complaints }) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const ZOOM_THRESHOLD = 14; // Limite de zoom para alternar entre polígono e pin

  useEffect(() => {
    // Obter localização atual
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentPosition(pos);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!mapElement.current) return;

    // Configurar camada de satélite
    const satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19
      })
    });

    // Criar mapa com zoom mais próximo
    const map = new Map({
      target: mapElement.current,
      layers: [satelliteLayer],
      view: new View({
        center: currentPosition 
          ? fromLonLat([currentPosition.lng, currentPosition.lat])
          : fromLonLat([-47.9292, -15.7801]),
        zoom: currentPosition ? 18 : 4 // Aumentado de 15 para 18
      })
    });

    mapRef.current = map;

    // Adicionar camada de vetores para as denúncias
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 1 // Garantir que os polígonos fiquem acima do mapa
    });
    map.addLayer(vectorLayer);

    // Função para criar estilo baseado no zoom
    const createFeatureStyle = (feature, resolution) => {
      const complaint = feature.get('properties');
      const geometry = feature.getGeometry();
      const zoom = map.getView().getZoom();
      
      const getStatusColor = (status) => {
        const colors = {
          'Em Análise': '#4287f5',    // Azul
          'Em Andamento': '#FFD700',  // Amarelo
          'Em Verificação': '#9932CC', // Roxo
          'Resolvido': '#32CD32',     // Verde
          'Cancelado': '#FF0000',     // Vermelho
          'Reaberto': '#FFA500'       // Laranja
        };
        return colors[status] || colors['Em Análise'];
      };

      const statusColor = getStatusColor(complaint.status);

      // Se for um ponto (localização atual), sempre mostrar como círculo
      if (geometry instanceof Point) {
        return new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({
              color: '#3b82f6'
            }),
            stroke: new Stroke({
              color: '#ffffff',
              width: 2
            })
          })
        });
      }

      // Para denúncias, alternar entre polígono e pin baseado no zoom
      if (zoom < ZOOM_THRESHOLD) {
        // Mostrar pin
        const center = geometry.getInteriorPoint().getCoordinates();
        return new Style({
          geometry: new Point(center),
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({
              color: statusColor
            }),
            stroke: new Stroke({
              color: '#ffffff',
              width: 2
            })
          })
        });
      } else {
        // Mostrar polígono
        return new Style({
          fill: new Fill({
            color: `${statusColor}33`
          }),
          stroke: new Stroke({
            color: statusColor,
            width: 3
          })
        });
      }
    };

    // Adicionar polígonos das denúncias
    complaints.forEach(complaint => {
      if (complaint.polygonCoordinates) {
        try {
          const coords = typeof complaint.polygonCoordinates === 'string' 
            ? JSON.parse(complaint.polygonCoordinates) 
            : complaint.polygonCoordinates;

          if (coords && coords.length > 0) {
            const transformedCoords = coords.map(coord => 
              fromLonLat([parseFloat(coord[0]), parseFloat(coord[1])])
            );

            const polygonFeature = new Feature({
              geometry: new Polygon([transformedCoords]),
              properties: complaint
            });

            // Usar estilo dinâmico
            polygonFeature.setStyle((feature, resolution) => 
              createFeatureStyle(feature, resolution)
            );

            vectorSource.addFeature(polygonFeature);
          }
        } catch (error) {
          console.error('Erro ao processar polígono:', error);
        }
      }
    });

    // Atualizar estilos quando o zoom mudar
    map.getView().on('change:resolution', () => {
      vectorSource.getFeatures().forEach(feature => {
        feature.changed();
      });
    });

    // Adicionar marcador de localização atual
    if (currentPosition) {
      const locationFeature = new Feature({
        geometry: new Point(fromLonLat([currentPosition.lng, currentPosition.lat]))
      });

      locationFeature.setStyle(new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({
            color: '#3b82f6' // Azul
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 2
          })
        })
      }));

      vectorSource.addFeature(locationFeature);
    }

    // Adicionar interação de hover
    map.on('pointermove', function(e) {
      const feature = map.forEachFeatureAtPixel(e.pixel, function(feature) {
        return feature;
      });

      const element = mapElement.current;
      if (feature) {
        const complaint = feature.get('properties');
        element.style.cursor = 'pointer';
        
        const tooltip = document.getElementById('map-tooltip');
        if (tooltip) {
          tooltip.style.display = 'block';
          tooltip.style.left = e.pixel[0] + 'px';
          tooltip.style.top = (e.pixel[1] - 30) + 'px';
          tooltip.innerHTML = `
            <strong>${complaint.title}</strong><br>
            ${complaint.status}
          `;
        }
      } else {
        element.style.cursor = '';
        const tooltip = document.getElementById('map-tooltip');
        if (tooltip) {
          tooltip.style.display = 'none';
        }
      }
    });

    // Adicionar interação de clique
    map.on('click', function(e) {
      const feature = map.forEachFeatureAtPixel(e.pixel, function(feature) {
        return feature;
      });

      if (feature) {
        const complaint = feature.get('properties');
        window.location.href = `/denuncias/${complaint.id}`;
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
      }
    };
  }, [complaints, currentPosition]);

  return (
    <div className="relative">
      <div 
        ref={mapElement}
        className="w-full h-[400px] rounded-lg overflow-hidden shadow-md"
      />

      {/* Tooltip */}
      <div
        id="map-tooltip"
        className="absolute bg-white px-3 py-1 rounded shadow-md pointer-events-none hidden"
        style={{ zIndex: 1000 }}
      />

     
    </div>
  );
}

export default GlobalMap; 