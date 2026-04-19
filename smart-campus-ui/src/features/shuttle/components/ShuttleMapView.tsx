import React, { useEffect, useState, useRef } from 'react';
import { APIProvider, Map, useMap, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { type ShuttleRouteDTO } from '@/services/shuttleService';

interface ShuttleMapViewProps {
  routes: ShuttleRouteDTO[];
  selectedRouteId?: number | null;
  interactive?: boolean;
  onRouteClick?: (route: ShuttleRouteDTO) => void;
  zoom?: number;
  hideMarkers?: boolean;
}

// Center of Sri Lanka roughly
const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 };

function PolylineRenderer({ 
  route, 
  isSelected, 
  onClick 
}: { 
  route: ShuttleRouteDTO; 
  isSelected: boolean;
  onClick?: () => void;
}) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !window.google) return;

    // Decode the polyline string into an array of LatLng objects
    let path: google.maps.LatLng[] = [];
    try {
      if (route.polyline) {
        path = google.maps.geometry.encoding.decodePath(route.polyline);
      }
    } catch (e) {
      console.error('Failed to decode polyline for route', route.id, e);
    }

    if (path.length === 0) {
      // Fallback to straight line if decoding fails or no polyline provided
      path = [
        new google.maps.LatLng(route.originLat, route.originLng),
        new google.maps.LatLng(route.destLat, route.destLng)
      ];
    }

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: route.color || '#3b82f6',
      strokeOpacity: isSelected ? 1.0 : 0.6,
      strokeWeight: isSelected ? 6 : 4,
      zIndex: isSelected ? 10 : 1,
      map: map,
      clickable: !!onClick
    });

    if (onClick) {
      polyline.addListener('click', () => {
        onClick();
      });
      polyline.addListener('mouseover', () => {
        polyline.setOptions({ strokeOpacity: 1.0, strokeWeight: 6 });
      });
      polyline.addListener('mouseout', () => {
        if (!isSelected) {
          polyline.setOptions({ strokeOpacity: 0.6, strokeWeight: 4 });
        }
      });
    }

    polylineRef.current = polyline;

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, route, isSelected, onClick]);

  return null;
}

function MapBoundsController({ routes, selectedRouteId }: { routes: ShuttleRouteDTO[], selectedRouteId?: number | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google || routes.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    let hasValidPoints = false;

    if (selectedRouteId) {
      // Zoom to specific route
      const route = routes.find(r => r.id === selectedRouteId);
      if (route) {
        bounds.extend(new google.maps.LatLng(route.originLat, route.originLng));
        bounds.extend(new google.maps.LatLng(route.destLat, route.destLng));
        try {
          if (route.polyline) {
            const path = google.maps.geometry.encoding.decodePath(route.polyline);
            path.forEach(p => bounds.extend(p));
          }
        } catch (e) {
          // ignore
        }
        hasValidPoints = true;
      }
    } else {
      // Zoom to all routes
      routes.forEach(route => {
        bounds.extend(new google.maps.LatLng(route.originLat, route.originLng));
        bounds.extend(new google.maps.LatLng(route.destLat, route.destLng));
        hasValidPoints = true;
      });
    }

    if (hasValidPoints) {
      map.fitBounds(bounds);
      
      // Add some padding
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() && map.getZoom()! > 14) {
          map.setZoom(14);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, routes, selectedRouteId]);

  return null;
}

export default function ShuttleMapView({ 
  routes, 
  selectedRouteId, 
  interactive = true,
  onRouteClick,
  zoom = 8,
  hideMarkers = false
}: ShuttleMapViewProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [activeInfoWindow, setActiveInfoWindow] = useState<{id: number, type: 'origin' | 'dest', lat: number, lng: number, title: string, subtitle: string} | null>(null);

  if (!apiKey) {
    return (
      <div className="w-full h-full min-h-[300px] bg-gray-100 rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-gray-500 p-6 text-center">
        <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="font-semibold text-sm">Google Maps API Key Missing</p>
        <p className="text-xs mt-1">Please add VITE_GOOGLE_MAPS_API_KEY to your .env.local file.</p>
      </div>
    );
  }

  // Determine which routes to show. If a route is selected, maybe we want to fade others, but here we just pass isSelected to the renderer
  return (
    <APIProvider apiKey={apiKey} libraries={['geometry']}>
      <div className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative">
        <Map
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={zoom}
          gestureHandling={interactive ? 'greedy' : 'none'}
          disableDefaultUI={!interactive}
          mapId="SHUTTLE_MAP_ID"
        >
          {routes.map(route => (
            <PolylineRenderer 
              key={route.id} 
              route={route} 
              isSelected={selectedRouteId === route.id} 
              onClick={interactive && onRouteClick ? () => onRouteClick(route) : undefined}
            />
          ))}

          {!hideMarkers && routes.map(route => {
            const isSelected = selectedRouteId === route.id || selectedRouteId == null; // Show all if none selected, or only selected if one is selected
            if (!isSelected) return null;

            return (
              <React.Fragment key={route.id}>
                {/* Origin Marker */}
                <AdvancedMarker 
                  position={{ lat: route.originLat, lng: route.originLng }}
                  onClick={() => setActiveInfoWindow({id: route.id, type: 'origin', lat: route.originLat, lng: route.originLng, title: route.originName, subtitle: 'Origin - ' + route.name})}
                >
                  <Pin background={route.color || '#3b82f6'} borderColor={'#fff'} glyphColor={'#fff'} />
                </AdvancedMarker>

                {/* Destination Marker */}
                <AdvancedMarker 
                  position={{ lat: route.destLat, lng: route.destLng }}
                  onClick={() => setActiveInfoWindow({id: route.id, type: 'dest', lat: route.destLat, lng: route.destLng, title: route.destinationName, subtitle: 'Destination - ' + route.name})}
                >
                  <Pin background={'#ef4444'} borderColor={'#fff'} glyphColor={'#fff'} />
                </AdvancedMarker>
              </React.Fragment>
            );
          })}

          {activeInfoWindow && interactive && (
            <InfoWindow
              position={{ lat: activeInfoWindow.lat, lng: activeInfoWindow.lng }}
              onCloseClick={() => setActiveInfoWindow(null)}
            >
              <div className="p-1 max-w-[200px]">
                <p className="text-xs font-bold text-gray-900">{activeInfoWindow.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{activeInfoWindow.subtitle}</p>
              </div>
            </InfoWindow>
          )}

          <MapBoundsController routes={routes} selectedRouteId={selectedRouteId} />
        </Map>
      </div>
    </APIProvider>
  );
}
