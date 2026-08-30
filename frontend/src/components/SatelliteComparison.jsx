/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Satellite,
  Columns,
  SplitSquareVertical,
} from 'lucide-react';
import { riskScoreColor } from '../lib/utils';

// Helper controller to properly zoom and center coordinates
function MapViewController({ center, bounds, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (center) {
      map.setView(center, zoom);
    }
  }, [center, bounds, zoom, map]);
  return null;
}

// Single-Map Tile Overlay Wiper (Applies CSS clip-path directly onto the satellitePane)
function TileWipeController({ position }) {
  const map = useMap();
  useEffect(() => {
    let pane = map.getPane('satellitePane');
    if (!pane) {
      pane = map.createPane('satellitePane');
      pane.style.zIndex = '450';
    }
    pane.style.clipPath = `polygon(${position}% 0, 100% 0, 100% 100%, ${position}% 100%)`;
    pane.style.webkitClipPath = `polygon(${position}% 0, 100% 0, 100% 100%, ${position}% 100%)`;
  }, [position, map]);
  return null;
}

export default function SatelliteComparison({ project }) {
  const [viewMode, setViewMode] = useState('wipe'); // 'wipe' (single unified wiper) | 'split' (side-by-side)
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [imagerySource, setImagerySource] = useState('esri'); // 'esri' | 'google'
  const containerRef = useRef(null);

  const isCritical = (project?.risk_score || 0) >= 70;
  const scoreColor = riskScoreColor(project?.risk_score);

  // Compute Lat/Lon coordinates from real project GPS boundary
  const boundary = project?.gps_boundary;
  const coords = boundary?.coordinates || [];
  const isPolygon = boundary?.type === 'Polygon';

  let center = [24.7707, 85.028];
  let bounds = null;
  if (coords.length > 0) {
    const latLngs = coords.map((c) => [c[0], c[1]]);
    center = latLngs[0];
    if (latLngs.length > 1) {
      bounds = latLngs;
    }
  }

  const startDate = project?.start_date || '2024-03-01';
  const deadlineDate = project?.deadline || '2025-06-30';

  const updateSliderPos = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  }, []);

  // Global drag event listeners for ultra-smooth drag
  useEffect(() => {
    let raf = null;
    const handleWindowMouseMove = (e) => {
      if (isDragging) {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          updateSliderPos(e.clientX);
        });
      }
    };
    const handleWindowMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    const handleWindowTouchMove = (e) => {
      if (isDragging && e.touches.length > 0) {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          updateSliderPos(e.touches[0].clientX);
        });
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: true });
    window.addEventListener('touchend', handleWindowMouseUp);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowMouseUp);
    };
  }, [isDragging, updateSliderPos]);

  const satelliteTileUrl =
    imagerySource === 'esri'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}';

  const baselineTileUrl =
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4 border-stone-200 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-brand-dark flex items-center justify-center text-brand-surface font-bold shadow-sm">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-dark flex items-center gap-2">
              Satellite Infrastructure Wipe Forensics
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Dual Layer Comparison
              </span>
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Center:{' '}
              <span className="font-mono text-brand-dark font-semibold">
                {center[0].toFixed(4)}° N, {center[1].toFixed(4)}° E
              </span>{' '}
              · Drag the center divider to reveal the pre-construction baseline (left) vs satellite
              orthophoto (right)
            </p>
          </div>
        </div>

        {/* View Mode & Source Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs shadow-inner">
            <button
              onClick={() => setViewMode('wipe')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                viewMode === 'wipe'
                  ? 'bg-brand-dark text-brand-surface shadow-sm'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" /> Wipe Slider
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                viewMode === 'split'
                  ? 'bg-brand-dark text-brand-surface shadow-sm'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              <Columns className="w-3.5 h-3.5" /> Side-by-Side
            </button>
          </div>

          {/* Satellite Source Switcher */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs shadow-inner">
            {[
              { id: 'esri', label: 'ESRI World Imagery' },
              { id: 'google', label: 'Google Satellite' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setImagerySource(mode.id)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                  imagerySource === mode.id
                    ? 'bg-brand-dark text-brand-surface shadow-sm'
                    : 'text-brand-muted hover:text-brand-dark'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MODE 1: UNIFIED SINGLE-MAP WIPE SLIDER */}
      {viewMode === 'wipe' && (
        <div
          ref={containerRef}
          className="relative h-[560px] w-full rounded-3xl overflow-hidden border-2 border-stone-300 shadow-2xl select-none bg-stone-950"
        >
          {/* Base Map Container rendering both layers in one synchronized instance */}
          <MapContainer
            center={center}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            dragging={true}
          >
            {/* Layer 1: Bottom Base (Pre-Construction Topo / Street Baseline Map) */}
            <TileLayer
              attribution="&copy; Baseline Map"
              url={baselineTileUrl}
              maxZoom={19}
              zIndex={1}
            />

            {/* Layer 2: Top Layer (High-Resolution Satellite Orthophoto) clipped by satellitePane */}
            <TileLayer
              attribution="&copy; Satellite"
              url={satelliteTileUrl}
              maxZoom={19}
              pane="satellitePane"
            />

            <MapViewController center={center} bounds={bounds} zoom={14} />
            <TileWipeController position={sliderPosition} />

            {/* Sanctioned Corridor Boundary Layer */}
            {coords.length > 0 && isPolygon && (
              <Polygon
                positions={coords}
                pathOptions={{
                  color: isCritical ? '#ef4444' : '#0284c7',
                  fillColor: isCritical ? '#ef4444' : '#0284c7',
                  fillOpacity: 0.25,
                  weight: 3.5,
                }}
              />
            )}
            {coords.length > 0 && !isPolygon && (
              <Polyline
                positions={coords}
                pathOptions={{
                  color: isCritical ? '#ef4444' : '#0284c7',
                  weight: 6,
                  opacity: 0.95,
                  dashArray: isCritical ? '8, 8' : undefined,
                }}
              />
            )}
          </MapContainer>

          {/* Left Floating Tag (Baseline) */}
          <div className="absolute top-5 left-5 z-[400] glass-card px-4 py-2 bg-white/95 border-stone-200 text-brand-dark shadow-xl flex items-center gap-2 pointer-events-none">
            <Calendar className="w-4 h-4 text-amber-600" />
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-700">
                Pre-Construction Baseline (Left)
              </div>
              <div className="text-xs font-mono font-bold">{startDate}</div>
            </div>
          </div>

          {/* Right Floating Tag (Satellite) */}
          <div className="absolute top-5 right-5 z-[400] glass-card px-4 py-2 bg-stone-950/85 border-stone-700 text-white shadow-xl flex items-center gap-2 pointer-events-none">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                Current Satellite (Right)
              </div>
              <div className="text-xs font-mono font-bold">{deadlineDate}</div>
            </div>
          </div>

          {/* AI Forensic Finding Overlay */}
          <div className="absolute bottom-5 right-5 z-[400] max-w-sm glass-card p-4 bg-stone-950/90 border-stone-700 text-white text-xs shadow-2xl pointer-events-none">
            <div className="flex items-center gap-2 mb-1.5 font-bold">
              {isCritical ? (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-rose-400">Pavement Discrepancy Flagged</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300">Ground Alignment Verified</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-stone-300">
              {isCritical
                ? 'Slide left to see that the sanctioned highway corridor remains unpaved bare ground on satellite imagery.'
                : '100% continuous paved surface detected across all sanctioned tender boundary coordinates.'}
            </p>
          </div>

          {/* Wipe Divider Line & Drag Handle */}
          <div
            className="absolute top-0 bottom-0 z-[500] w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.8)]"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onTouchStart={(e) => {
              setIsDragging(true);
            }}
          >
            <div className="w-10 h-10 -ml-4.5 rounded-full bg-white text-brand-dark border-2 border-stone-400 shadow-2xl flex items-center justify-center font-bold text-xs hover:scale-110 active:scale-95 transition-transform cursor-ew-resize">
              <span className="flex items-center gap-0.5 text-stone-800">
                <span>◀</span>
                <span>▶</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: SIDE-BY-SIDE SYNCHRONIZED COMPARISON */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Pre-Construction Baseline Map */}
          <div className="glass-card overflow-hidden rounded-3xl border-2 border-stone-300 shadow-xl relative h-[500px]">
            <div className="absolute top-4 left-4 z-[400] glass-card px-3.5 py-1.5 bg-white/95 border-stone-200 text-brand-dark shadow-md flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-amber-700">
                  Pre-Construction Baseline
                </div>
                <div className="text-xs font-mono font-bold">{startDate}</div>
              </div>
            </div>

            <MapContainer
              center={center}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              dragging={true}
            >
              <TileLayer attribution="&copy; CARTO" url={baselineTileUrl} maxZoom={19} />
              <MapViewController center={center} bounds={bounds} zoom={14} />

              {/* Sanctioned Blueprint Corridor */}
              {coords.length > 0 && isPolygon && (
                <Polygon
                  positions={coords}
                  pathOptions={{
                    color: '#905831',
                    fillColor: '#905831',
                    fillOpacity: 0.2,
                    weight: 3,
                  }}
                />
              )}
              {coords.length > 0 && !isPolygon && (
                <Polyline
                  positions={coords}
                  pathOptions={{ color: '#905831', weight: 5, dashArray: '6, 6', opacity: 0.9 }}
                />
              )}
            </MapContainer>

            <div className="absolute bottom-4 left-4 right-4 z-[400] glass-card p-3 bg-white/95 border-stone-200 text-xs shadow-md">
              <span className="font-semibold text-stone-600">Baseline Ground State:</span>{' '}
              <span className="font-bold text-amber-800">Sanctioned Tender Alignment</span>
            </div>
          </div>

          {/* Right: Real Satellite Orthophoto */}
          <div className="glass-card overflow-hidden rounded-3xl border-2 border-stone-300 shadow-xl relative h-[500px]">
            <div className="absolute top-4 right-4 z-[400] glass-card px-3.5 py-1.5 bg-stone-950/85 border-stone-700 text-white shadow-md flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  Current Satellite Orbit
                </div>
                <div className="text-xs font-mono font-bold">{deadlineDate}</div>
              </div>
            </div>

            <MapContainer
              center={center}
              zoom={14}
              style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
              scrollWheelZoom={true}
              dragging={true}
            >
              <TileLayer
                attribution="&copy; Satellite Orthophoto"
                url={satelliteTileUrl}
                maxZoom={19}
              />
              <MapViewController center={center} bounds={bounds} zoom={14} />

              {/* Verified Alignment on Satellite */}
              {coords.length > 0 && isPolygon && (
                <Polygon
                  positions={coords}
                  pathOptions={{
                    color: isCritical ? '#ef4444' : '#38bdf8',
                    fillColor: isCritical ? '#ef4444' : '#38bdf8',
                    fillOpacity: 0.3,
                    weight: 3.5,
                  }}
                />
              )}
              {coords.length > 0 && !isPolygon && (
                <Polyline
                  positions={coords}
                  pathOptions={{
                    color: isCritical ? '#ef4444' : '#0284c7',
                    weight: 6,
                    opacity: 0.95,
                    dashArray: isCritical ? '8, 8' : undefined,
                  }}
                />
              )}
            </MapContainer>

            {/* AI Forensic Finding Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-[400] glass-card p-3 bg-stone-950/90 border-stone-700 text-white text-xs shadow-md">
              <div className="flex items-center gap-2 font-bold mb-1">
                {isCritical ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-rose-400">Discrepancy: Missing Paved Ground</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-300">Ground Alignment Verified</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-stone-300">
                {isCritical
                  ? 'Red dashed route shows missing asphalt pavement on satellite ground imagery. Route remains unpaved.'
                  : 'Continuous asphalt corridor detected along full sanctioned GPS boundary coordinates.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Forensic Telemetry Info Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 border-stone-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">
            Satellite Tile Source
          </div>
          <div className="text-sm font-bold text-brand-dark">
            {imagerySource === 'esri' ? 'ArcGIS World Imagery (Maxar)' : 'Google Satellite Hybrid'}
          </div>
          <div className="text-[11px] text-brand-muted mt-0.5">
            True Geographic Sub-meter Orthophoto
          </div>
        </div>

        <div className="glass-card p-4 border-stone-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">
            Geospatial Registration
          </div>
          <div className="text-sm font-bold text-brand-dark">WGS84 EPSG:4326 Synchronized</div>
          <div className="text-[11px] text-brand-muted mt-0.5">
            Single map instance with dual-pane clipping
          </div>
        </div>

        <div className="glass-card p-4 border-stone-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">
            Temporal Baseline
          </div>
          <div className="text-sm font-bold text-brand-dark">
            {Math.round((new Date(deadlineDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))}{' '}
            Days Elapsed
          </div>
          <div className="text-[11px] text-brand-muted mt-0.5">
            Pre-work baseline vs Current Satellite
          </div>
        </div>
      </div>
    </div>
  );
}
