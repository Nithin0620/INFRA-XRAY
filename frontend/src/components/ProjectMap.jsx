import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { categoryIcon, riskScoreColor, formatINR } from '../lib/utils';
import { Camera, AlertCircle, CheckCircle } from 'lucide-react';

// Custom DivIcon for Project Markers
export function createProjectIcon(score, isSelected = false) {
  const color = riskScoreColor(score);
  const size = isSelected ? 38 : 30;
  const pulseClass = score >= 70 ? 'animate-pulse' : '';

  return L.divIcon({
    className: 'custom-project-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: #0f172a;
        border: 2px solid ${color};
        box-shadow: 0 0 14px ${color}80;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${color};
        font-weight: 700;
        font-size: ${isSelected ? '12px' : '10px'};
        font-family: monospace;
        cursor: pointer;
        transition: all 0.3s ease;
      " class="${pulseClass}">
        ${score ?? '—'}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Custom DivIcon for Photo Markers
export function createPhotoIcon(conditionTag) {
  const isDamaged = conditionTag === 'pothole' || conditionTag === 'cracking';
  const color = isDamaged ? '#ef4444' : '#10b981';

  return L.divIcon({
    className: 'custom-photo-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: #030712;
        border: 1.5px solid ${color};
        box-shadow: 0 0 8px ${color}90;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${color};
        cursor: pointer;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
          <circle cx="12" cy="13" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function MapController({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, bounds, map]);
  return null;
}

export default function ProjectMap({
  project,
  photos = [],
  height = '450px',
  interactive = true,
  onSelectProject,
}) {
  if (!project) return null;

  const boundary = project.gps_boundary;
  const coords = boundary?.coordinates || [];
  const isPolygon = boundary?.type === 'Polygon';

  // Calculate center and bounds
  let center = [22.5937, 78.9629]; // India center
  let bounds = null;

  if (coords.length > 0) {
    const latLngs = coords.map((c) => [c[0], c[1]]);
    center = latLngs[0];
    if (latLngs.length > 1) {
      bounds = latLngs;
    }
  }

  const scoreColor = riskScoreColor(project.risk_score);

  return (
    <div
      style={{ height, width: '100%' }}
      className="rounded-2xl overflow-hidden border border-white/10 relative z-0"
    >
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%', background: '#090d16' }}
        scrollWheelZoom={interactive}
        dragging={interactive}
      >
        {/* Dark Theme Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <MapController center={center} zoom={bounds ? undefined : 13} bounds={bounds} />

        {/* Boundary Rendering */}
        {coords.length > 0 && isPolygon && (
          <Polygon
            positions={coords}
            pathOptions={{
              color: scoreColor,
              fillColor: scoreColor,
              fillOpacity: 0.2,
              weight: 2.5,
              dashArray: project.risk_score >= 70 ? '6, 6' : undefined,
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 text-xs">
                <div className="font-bold text-gray-900">{project.project_name}</div>
                <div className="text-gray-600 mt-1">
                  Type: {project.category} · Boundary: {coords.length} points
                </div>
              </div>
            </Popup>
          </Polygon>
        )}

        {coords.length > 0 && !isPolygon && (
          <Polyline
            positions={coords}
            pathOptions={{
              color: scoreColor,
              weight: 4,
              opacity: 0.85,
              dashArray: project.risk_score >= 70 ? '8, 6' : undefined,
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 text-xs">
                <div className="font-bold text-gray-900">{project.project_name}</div>
                <div className="text-gray-600 mt-1">
                  Sanctioned Route: {project.sanctioned_quantity} {project.unit}
                </div>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Project Centroid / Start Marker */}
        {coords.length > 0 && (
          <Marker
            position={coords[0]}
            icon={createProjectIcon(project.risk_score, true)}
            eventHandlers={{
              click: () => onSelectProject && onSelectProject(project),
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-2 text-xs">
                <div className="font-bold text-gray-900">{project.project_name}</div>
                <div className="text-gray-600 mt-1">
                  {project.state} · {formatINR(project.sanctioned_amount_inr)}
                </div>
                <div className="mt-1.5 flex items-center gap-1 font-semibold" style={{ color: scoreColor }}>
                  Risk Score: {project.risk_score ?? 'N/A'}/100 ({project.severity_label || 'Assessed'})
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Site Photos Markers */}
        {photos.map((photo, idx) => {
          if (!photo.gps_lat || !photo.gps_lon) return null;
          const isDamaged = photo.condition_tag === 'pothole' || photo.condition_tag === 'cracking';

          return (
            <Marker
              key={photo.photo_id || idx}
              position={[photo.gps_lat, photo.gps_lon]}
              icon={createPhotoIcon(photo.condition_tag)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-2 text-xs max-w-[200px]">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <Camera className="w-3.5 h-3.5 text-brand-600" />
                    {photo.photo_id}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px]">
                    Condition:{' '}
                    <span
                      className={`font-semibold ${
                        isDamaged ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {photo.condition_tag?.replace('_', ' ')}
                    </span>
                  </div>
                  {photo.timestamp && (
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Captured: {new Date(photo.timestamp).toLocaleString()}
                    </div>
                  )}
                  {photo.filepath && (
                    <div className="mt-2 rounded overflow-hidden border border-gray-200">
                      <img
                        src={`http://localhost:3001/data/${photo.filepath}`}
                        alt={photo.photo_id}
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
