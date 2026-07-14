import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icon issue under bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Set default icon globally for Leaflet markers
L.Marker.prototype.options.icon = DefaultIcon;

// Child controller component to update map view dynamically
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

// Child events component to catch clicks
const MapEventsHandler = ({ onClick, readOnly }) => {
  useMapEvents({
    click(e) {
      if (!readOnly && onClick) {
        onClick(e.latlng);
      }
    },
  });
  return null;
};

const Map = forwardRef(({
  center = [21.0285, 105.8542], // Hanoi, Vietnam
  zoom = 13,
  markers = [], // Array of { id, lat, lng, title, popupContent, draggable, iconUrl }
  onMarkerDragEnd,
  onMapClick,
  height = '400px',
  width = '100%',
  tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileLayerAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  searchEnabled = true,
  readOnly = false,
  className = '',
  style = {}
}, ref) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [mapMarkers, setMapMarkers] = useState(markers);
  const [mapReadOnly, setMapReadOnly] = useState(readOnly);

  // Sync state if center/zoom/markers/readOnly props change
  useEffect(() => {
    if (center) setMapCenter(center);
  }, [center]);

  useEffect(() => {
    if (zoom) setMapZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    if (markers) setMapMarkers(markers);
  }, [markers]);

  useEffect(() => {
    setMapReadOnly(readOnly);
  }, [readOnly]);

  // Imperative handle for external access
  useImperativeHandle(ref, () => ({
    option(name, nextValue) {
      if (arguments.length === 1) {
        if (name === 'center') return mapCenter;
        if (name === 'zoom') return mapZoom;
        if (name === 'markers') return mapMarkers;
        if (name === 'readOnly') return mapReadOnly;
        return undefined;
      }
      if (name === 'center') setMapCenter(nextValue);
      if (name === 'zoom') setMapZoom(nextValue);
      if (name === 'markers') setMapMarkers(nextValue);
      if (name === 'readOnly') setMapReadOnly(nextValue);
    }
  }));

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Geocoding lookup failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setMapCenter([lat, lon]);
    setMapZoom(16);
    setSearchResults([]);
    setSearchQuery(result.display_name);
    if (onMapClick) {
      onMapClick({ lat, lng: lon, address: result.display_name });
    }
  };

  const getMarkerIcon = (m) => {
    if (m.iconUrl) {
      return L.icon({
        iconUrl: m.iconUrl,
        iconSize: m.iconSize || [25, 41],
        iconAnchor: m.iconAnchor || [12, 41],
        popupAnchor: m.popupAnchor || [1, -34],
        shadowUrl: m.shadowUrl || shadowUrl,
        shadowSize: m.shadowSize || [41, 41]
      });
    }
    return DefaultIcon;
  };

  return (
    <div 
      className={`tmivcom-map-container ${className}`} 
      style={{ 
        position: 'relative', 
        height, 
        width, 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px', 
        overflow: 'hidden', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        ...style 
      }}
    >
      {/* Absolute search panel overlay */}
      {searchEnabled && !mapReadOnly && (
        <div 
          className="map-search-panel"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            width: '280px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '8px',
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
          }}
        >
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '4px' }}>
            <input 
              type="text" 
              placeholder="Search address..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: '13px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                outline: 'none'
              }}
            />
            <button 
              type="submit"
              disabled={isSearching}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isSearching ? '...' : 'Go'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div 
              className="map-search-results"
              style={{
                marginTop: '6px',
                maxHeight: '150px',
                overflowY: 'auto',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '4px'
              }}
            >
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectResult(result)}
                  style={{
                    padding: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'background 0.2s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title={result.display_name}
                >
                  {result.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* React-Leaflet Map Instance */}
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={true}
      >
        <TileLayer
          url={tileLayerUrl}
          attribution={tileLayerAttribution}
        />
        
        <MapController center={mapCenter} zoom={mapZoom} />
        <MapEventsHandler onClick={onMapClick} readOnly={mapReadOnly} />

        {mapMarkers.map((m, idx) => (
          <Marker
            key={m.id || idx}
            position={[m.lat, m.lng]}
            draggable={!mapReadOnly && m.draggable !== false}
            icon={getMarkerIcon(m)}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                if (onMarkerDragEnd) {
                  onMarkerDragEnd(m.id || idx, position);
                }
              }
            }}
          >
            {(m.title || m.popupContent) && (
              <Popup>
                <div style={{ fontSize: '13px', fontFamily: 'sans-serif' }}>
                  {m.title && <strong style={{ display: 'block', marginBottom: '4px' }}>{m.title}</strong>}
                  {m.popupContent && <div>{m.popupContent}</div>}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
});

Map.displayName = 'Map';
export default Map;
