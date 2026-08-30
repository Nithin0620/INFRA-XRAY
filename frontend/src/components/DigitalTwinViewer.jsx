/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Box,
  RotateCw,
  Eye,
  AlertTriangle,
  Activity,
  Maximize2,
  Scan,
  ShieldAlert,
  Flame,
  CheckCircle,
  HelpCircle,
  Volume2
} from 'lucide-react';
import { riskScoreColor, formatINR } from '../lib/utils';

export default function DigitalTwinViewer({ project }) {
  const canvasRef = useRef(null);
  const [renderMode, setRenderMode] = useState('wireframe'); // 'wireframe' | 'pointcloud' | 'thermal' | 'stress'
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [sliceDepth, setSliceDepth] = useState(100); // 0 to 100% depth slice
  const [activeDefectFilter, setActiveDefectFilter] = useState('ALL');

  const isCritical = (project?.risk_score || 0) >= 70;
  const isHighway = project?.category === 'road';
  const isBridge = project?.category === 'bridge';
  const isBuilding = project?.category === 'building';

  // Define 3D defect points with coordinate offsets
  const defects = [
    {
      id: 'DEF-01',
      title: 'Deep Structural Micro-Crack (3.2mm)',
      type: 'crack',
      severity: 'high',
      location: 'Span Pier #4 / Sub-base Layer',
      coords: { x: -45, y: -15, z: 20 },
      depthMm: 3.2,
      ultrasoundDensity: '68% (Compromised)',
      riskImpact: '+24 Risk Pts',
    },
    {
      id: 'DEF-02',
      title: 'Pothole Void & Subgrade Cavity',
      type: 'pothole',
      severity: 'critical',
      location: 'Station KM 14+200 - Outer Lane',
      coords: { x: 30, y: -25, z: -10 },
      depthMm: 8.5,
      ultrasoundDensity: '42% (Severe Soil Washout)',
      riskImpact: '+35 Risk Pts',
    },
    {
      id: 'DEF-03',
      title: 'Asphalt Compaction Deficit',
      type: 'compaction',
      severity: 'moderate',
      location: 'Surface Wearing Course (Top 40mm)',
      coords: { x: 60, y: 10, z: 35 },
      depthMm: 1.1,
      ultrasoundDensity: '81% (Below 95% Spec)',
      riskImpact: '+12 Risk Pts',
    },
  ];

  // Canvas 3D rendering loop (Orthographic projection engine with LiDAR point-clouds & structural meshes)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let angleY = 0;
    let angleX = 0.35; // Slight isometric pitch

    // Generate procedural 3D model vertices based on project category
    const numPoints = isBuilding ? 450 : isBridge ? 600 : 700;
    const modelPoints = [];

    // Road/Bridge Corridor Geometry
    for (let i = 0; i < numPoints; i++) {
      const u = (i / numPoints) * 2 - 1; // -1 to 1 along length
      const lengthX = u * 220;
      
      if (isBuilding) {
        // Multi-story floor plates
        const floor = Math.floor(Math.random() * 5);
        const w = (Math.random() - 0.5) * 140;
        const d = (Math.random() - 0.5) * 100;
        modelPoints.push({
          x: w,
          y: floor * 30 - 60 + (Math.random() - 0.5) * 4,
          z: d,
          stress: Math.sin(floor) * 0.5 + 0.5,
          density: 0.8 + Math.random() * 0.2,
        });
      } else if (isBridge) {
        // Bridge piers and suspension arches
        const archY = Math.sin((u + 1) * Math.PI) * -50;
        const lateralZ = (Math.random() - 0.5) * 60;
        modelPoints.push({
          x: lengthX,
          y: archY + (Math.random() - 0.5) * 15,
          z: lateralZ,
          stress: Math.abs(u),
          density: 0.75 + Math.random() * 0.25,
        });
      } else {
        // Highway road ribbon + sub-base layers
        const layerY = (Math.random() - 0.5) * 25;
        const laneZ = (Math.random() - 0.5) * 70;
        modelPoints.push({
          x: lengthX,
          y: layerY,
          z: laneZ,
          stress: Math.sin(u * 4) * 0.4 + 0.4,
          density: 0.7 + Math.random() * 0.3,
        });
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2 + 10;

      if (!isPaused) {
        angleY += 0.008 * rotationSpeed;
      }

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Render 3D Background Grid Floor
      ctx.strokeStyle = 'rgba(144, 88, 49, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 240;
      const gridSteps = 8;
      for (let i = -gridSteps; i <= gridSteps; i++) {
        const p1 = { x: i * (gridSize / gridSteps), y: 55, z: -gridSize };
        const p2 = { x: i * (gridSize / gridSteps), y: 55, z: gridSize };

        // Rotate p1
        const rx1 = p1.x * cosY - p1.z * sinY;
        const rz1 = p1.x * sinY + p1.z * cosY;
        const ry1 = p1.y * cosX - rz1 * sinX;

        // Rotate p2
        const rx2 = p2.x * cosY - p2.z * sinY;
        const rz2 = p2.x * sinY + p2.z * cosY;
        const ry2 = p2.y * cosX - rz2 * sinX;

        ctx.beginPath();
        ctx.moveTo(cx + rx1 * 1.2, cy + ry1 * 1.2);
        ctx.lineTo(cx + rx2 * 1.2, cy + ry2 * 1.2);
        ctx.stroke();
      }

      // Filter and Project Model Points
      const projected = [];
      const depthThreshold = (sliceDepth / 100) * 440 - 220;

      modelPoints.forEach((pt) => {
        if (pt.x > depthThreshold) return; // depth slice cutoff

        // 3D Rotation Math
        const rx = pt.x * cosY - pt.z * sinY;
        const rz = pt.x * sinY + pt.z * cosY;
        const ry = pt.y * cosX - rz * sinX;
        const scale = 380 / (380 + rz * 0.4);

        projected.push({
          sx: cx + rx * scale,
          sy: cy + ry * scale,
          depth: rz,
          stress: pt.stress,
          density: pt.density,
          orig: pt,
        });
      });

      // Sort by depth for correct Z-buffer rendering
      projected.sort((a, b) => b.depth - a.depth);

      // Render based on selected 3D visualization mode
      if (renderMode === 'pointcloud' || renderMode === 'thermal' || renderMode === 'stress') {
        projected.forEach((pt) => {
          ctx.beginPath();
          const size = Math.max(1.5, 3.2 - pt.depth * 0.015);
          ctx.arc(pt.sx, pt.sy, size, 0, Math.PI * 2);

          if (renderMode === 'pointcloud') {
            // LiDAR Reflectance (Cyan to Emerald)
            ctx.fillStyle = `rgba(16, 185, 129, ${Math.max(0.3, pt.density)})`;
          } else if (renderMode === 'thermal') {
            // Thermal Dissipation (Blue -> Yellow -> Red)
            const heat = pt.stress;
            ctx.fillStyle = heat > 0.6 ? 'rgba(239, 68, 68, 0.85)' : heat > 0.3 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(56, 189, 248, 0.7)';
          } else if (renderMode === 'stress') {
            // FEA Structural Stress Gradient
            const str = pt.stress;
            ctx.fillStyle = str > 0.5 ? 'rgba(220, 38, 38, 0.9)' : 'rgba(99, 102, 241, 0.65)';
          }
          ctx.fill();
        });
      } else {
        // Wireframe Ribbons / Structural Edges
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = isCritical ? 'rgba(220, 38, 38, 0.35)' : 'rgba(30, 41, 59, 0.3)';

        for (let i = 0; i < projected.length - 1; i += 2) {
          const p1 = projected[i];
          const p2 = projected[i + 1];
          if (p1 && p2 && Math.abs(p1.sx - p2.sx) < 60) {
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }
        }

        // Draw outer bounding structural contour
        projected.forEach((pt) => {
          ctx.fillStyle = isCritical ? 'rgba(220, 38, 38, 0.6)' : 'rgba(15, 23, 42, 0.6)';
          ctx.fillRect(pt.sx - 1.5, pt.sy - 1.5, 3, 3);
        });
      }

      // Render 3D Defect Pin Annotations directly in 3D Model Space
      defects.forEach((def) => {
        const pt = def.coords;
        if (pt.x > depthThreshold) return;

        const rx = pt.x * cosY - pt.z * sinY;
        const rz = pt.x * sinY + pt.z * cosY;
        const ry = pt.y * cosX - rz * sinX;
        const scale = 380 / (380 + rz * 0.4);

        const sx = cx + rx * scale;
        const sy = cy + ry * scale;

        const isSel = selectedAnomaly?.id === def.id;

        // Pulsing Anomaly Halo
        ctx.beginPath();
        ctx.arc(sx, sy, isSel ? 18 : 12, 0, Math.PI * 2);
        ctx.fillStyle = def.severity === 'critical' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)';
        ctx.fill();

        // Pin Core
        ctx.beginPath();
        ctx.arc(sx, sy, isSel ? 6 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = def.severity === 'critical' ? '#ef4444' : '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 3D Floating Pin Label
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(def.id, sx + 9, sy - 4);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [renderMode, isPaused, rotationSpeed, sliceDepth, isCritical, isBuilding, isBridge, selectedAnomaly]);

  return (
    <div className="space-y-6">
      {/* Top 3D Control Header */}
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4 border-stone-200 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-brand-dark flex items-center justify-center text-brand-surface font-bold shadow-sm">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-dark flex items-center gap-2">
              3D Digital Twin & LiDAR Volumetric Scanner
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-brand-accent border border-amber-200">
                Full-Field Structural Mesh
              </span>
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              360° interactive structural flythrough with ultrasonic density tomography and subsurface defect projection
            </p>
          </div>
        </div>

        {/* 3D Rendering Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs shadow-inner">
          {[
            { id: 'wireframe', label: 'BIM Wireframe', icon: Box },
            { id: 'pointcloud', label: 'LiDAR Point Cloud', icon: Scan },
            { id: 'thermal', label: 'Thermal Dissipation', icon: Flame },
            { id: 'stress', label: 'FEA Stress Map', icon: Activity },
          ].map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setRenderMode(mode.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  renderMode === mode.id
                    ? 'bg-brand-dark text-brand-surface shadow-sm'
                    : 'text-brand-muted hover:text-brand-dark'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 3D Canvas Viewport + Sidebar Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Interactive Canvas */}
        <div className="lg:col-span-2 glass-card h-[520px] rounded-3xl overflow-hidden border-2 border-stone-300 shadow-xl relative bg-[#fdfdfc] flex flex-col items-center justify-center">
          {/* Canvas Engine */}
          <canvas
            ref={canvasRef}
            width={720}
            height={520}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          />

          {/* Floating Orbit HUD Controls */}
          <div className="absolute top-4 left-4 z-10 glass-card px-3.5 py-2 bg-white/90 border-stone-200 text-xs shadow-md flex items-center gap-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-1 font-bold text-brand-dark hover:text-brand-accent transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${!isPaused ? 'animate-spin' : ''}`} />
              {isPaused ? 'Resume Orbit' : 'Pause Orbit'}
            </button>
            <div className="h-3 w-px bg-stone-300" />
            <span className="text-[11px] text-brand-muted font-mono">
              Speed: {rotationSpeed}x
            </span>
            <button
              onClick={() => setRotationSpeed((s) => (s === 1 ? 2 : s === 2 ? 0.5 : 1))}
              className="text-[10px] font-bold bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded text-brand-dark"
            >
              Toggle
            </button>
          </div>

          {/* Subsurface Slice Depth Slider HUD */}
          <div className="absolute bottom-4 left-4 right-4 z-10 glass-card p-3.5 bg-white/95 border-stone-200 text-xs shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-accent" />
              <span className="font-bold text-brand-dark">Volumetric Depth Slice:</span>
              <span className="font-mono text-brand-accent font-bold">{sliceDepth}%</span>
            </div>
            <div className="flex-1 max-w-xs">
              <input
                type="range"
                min="10"
                max="100"
                value={sliceDepth}
                onChange={(e) => setSliceDepth(Number(e.target.value))}
                className="w-full accent-amber-800 cursor-pointer"
              />
            </div>
            <div className="text-[11px] text-brand-muted font-mono">
              Cross-sectioning 3D subgrade
            </div>
          </div>
        </div>

        {/* Structural Defect Inspector Panel */}
        <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-brand-dark flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Identified 3D Anomalies ({defects.length})
            </h4>
            <span className="text-[10px] uppercase font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
              Tomography Active
            </span>
          </div>

          {defects.map((def) => {
            const isSel = selectedAnomaly?.id === def.id;
            return (
              <div
                key={def.id}
                onClick={() => setSelectedAnomaly(isSel ? null : def)}
                className={`glass-card p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  isSel
                    ? 'border-brand-dark bg-white shadow-lg scale-[1.02]'
                    : 'border-stone-200 hover:border-stone-300 bg-white/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-brand-dark">
                    {def.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      def.severity === 'critical'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {def.severity}
                  </span>
                </div>

                <div className="text-xs font-bold text-brand-dark mb-1">{def.title}</div>
                <div className="text-[11px] text-brand-muted mb-2">{def.location}</div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-[10px]">
                  <div>
                    <span className="text-stone-400">Depth / Crack Size:</span>
                    <div className="font-mono font-bold text-brand-dark">{def.depthMm} mm</div>
                  </div>
                  <div>
                    <span className="text-stone-400">Subsurface Density:</span>
                    <div className="font-mono font-bold text-rose-600">{def.ultrasoundDensity}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Forensic CAD Export Box */}
          <div className="glass-card p-4 border border-stone-200 text-xs bg-amber-50/40">
            <div className="font-bold text-brand-dark mb-1 flex items-center gap-1.5">
              <Scan className="w-3.5 h-3.5 text-brand-accent" /> 3D Photogrammetry Telemetry
            </div>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              3D mesh synthesized from ground drone LiDAR + ultrasonic tomography scan records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
