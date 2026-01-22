
import React, { useEffect, useRef } from 'react';
import { Property } from '../types';

declare var L: any;

interface MapViewProps {
  properties: Property[];
  onPropertyClick: (p: Property) => void;
  center?: { lat: number; lng: number };
}

const MapView: React.FC<MapViewProps> = ({ properties, onPropertyClick, center }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter = center || { lat: 12.9716, lng: 77.5946 }; // Default Bangalore
    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false // Custom placement or just cleaner look
    }).setView([initialCenter.lat, initialCenter.lng], 13);

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(mapRef.current);

    // Initialize Marker Cluster Group
    clusterGroupRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      animate: true,
      chunkedLoading: true,
      maxClusterRadius: 50
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle center changes (e.g., "Near Me" button)
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.flyTo([center.lat, center.lng], 14, {
        animate: true,
        duration: 1.5
      });
    }
  }, [center]);

  // Update Markers
  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current) return;

    clusterGroupRef.current.clearLayers();
    const markers: any[] = [];

    properties.forEach(property => {
      const { lat, lng } = property.location;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="relative group">
              <div class="w-12 h-12 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center shadow-xl transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:z-50">
                <div class="w-9 h-9 bg-blue-600 rounded-full flex flex-col items-center justify-center text-white leading-none">
                  <span class="text-[8px] font-black opacity-80 uppercase">₹</span>
                  <span class="text-[10px] font-bold">${(property.rent / 1000).toFixed(1)}k</span>
                </div>
              </div>
              <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45 border-r border-b border-blue-600"></div>
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 48]
        })
      });

      // Quick hover tooltip
      marker.bindTooltip(`
        <div class="px-2 py-1 font-bold text-slate-800">
          ${property.name} <span class="text-blue-600 ml-1">₹${property.rent}</span>
        </div>
      `, {
        direction: 'top',
        offset: [0, -40],
        className: 'custom-tooltip'
      });

      // Rich click popup
      const popupContent = `
        <div class="flex flex-col w-[220px] overflow-hidden rounded-xl bg-white">
          <div class="relative h-28 w-full">
            <img src="${property.images[0]}" class="h-full w-full object-cover" alt="${property.name}" />
            <div class="absolute top-2 left-2">
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${property.available ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white shadow-sm'}">
                ${property.available ? 'Available' : 'Occupied'}
              </span>
            </div>
          </div>
          <div class="p-3">
            <h4 class="font-bold text-slate-800 text-sm mb-0.5 truncate">${property.name}</h4>
            <p class="text-[10px] text-slate-500 mb-2 truncate"><i class="fa-solid fa-location-dot mr-1"></i>${property.location.address}</p>
            
            <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <div class="flex flex-col">
                <span class="text-[9px] text-slate-400 font-bold uppercase">Monthly Rent</span>
                <span class="text-blue-600 font-black text-sm">₹${property.rent}</span>
              </div>
              <button id="view-details-${property.id}" class="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-black transition-colors active:scale-95">
                View Details
              </button>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 220,
        minWidth: 220,
        className: 'property-popup'
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-details-${property.id}`);
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onPropertyClick(property);
          });
        }
      });

      markers.push(marker);
    });

    clusterGroupRef.current.addLayers(markers);

    // Only fit bounds if we aren't following a specific user location
    if (markers.length > 0 && !center) {
      mapRef.current.fitBounds(clusterGroupRef.current.getBounds().pad(0.1));
    }
  }, [properties, onPropertyClick]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full bg-slate-100" />
      
      {/* Visual Overlay for context */}
      <div className="absolute top-4 left-4 z-[500] pointer-events-none">
        <div className="bg-white/90 backdrop-blur shadow-lg border border-slate-100 rounded-2xl px-4 py-2 flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-slate-700">Showing {properties.length} results</span>
        </div>
      </div>

      <style>{`
        .custom-tooltip {
          background: white !important;
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
          border-radius: 8px !important;
          padding: 0 !important;
        }
        .leaflet-tooltip-top:before {
          border-top-color: white !important;
        }
        .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 12px !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .property-popup .leaflet-popup-tip {
          background: white !important;
        }
      `}</style>
    </div>
  );
};

export default MapView;
