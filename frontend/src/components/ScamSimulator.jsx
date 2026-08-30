/* eslint-disable no-unused-vars */
import { useState, useMemo } from 'react';
import {
  Sliders,
  AlertTriangle,
  Flame,
  RotateCcw,
  Zap,
  TrendingUp,
  MapPin,
  FileSpreadsheet,
  Receipt,
  Scale,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { formatINR, riskScoreColor } from '../lib/utils';

export default function ScamSimulator({ project }) {
  // Baseline initial state
  const baseCost = project?.sanctioned_amount_inr || 24000000;
  const baseQty = project?.sanctioned_quantity || 15;
  const baseUnit = project?.unit || 'km';

  // Interactive slider parameters
  const [costInflationPercent, setCostInflationPercent] = useState(0); // -20% to +100%
  const [physicalUnderdeliveryPercent, setPhysicalUnderdeliveryPercent] = useState(0); // 0% to 80% ghost unbuilt
  const [gpsDeviationMeters, setGpsDeviationMeters] = useState(0); // 0m to 5000m off-route
  const [bidderCartelMarginPercent, setBidderCartelMarginPercent] = useState(0); // 0% to 50% kickback margin

  // Reset simulator
  const handleReset = () => {
    setCostInflationPercent(0);
    setPhysicalUnderdeliveryPercent(0);
    setGpsDeviationMeters(0);
    setBidderCartelMarginPercent(0);
  };

  // Real-time calculation engine
  const sim = useMemo(() => {
    const simulatedBilledCost = Math.round(baseCost * (1 + costInflationPercent / 100));
    const costExcess = simulatedBilledCost - baseCost;

    const simulatedActualQty = Math.max(0.1, baseQty * (1 - physicalUnderdeliveryPercent / 100));
    const ghostQty = baseQty - simulatedActualQty;
    const ghostWasteINR = Math.round((ghostQty / baseQty) * baseCost);

    // Calculate dynamic risk score (0 - 100)
    let score = project?.risk_score || 25;

    // Penalties
    score += costInflationPercent * 0.45;
    score += physicalUnderdeliveryPercent * 0.65;
    score += gpsDeviationMeters / 100;
    score += bidderCartelMarginPercent * 0.4;

    const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

    // Categorize severity
    let label = 'Low';
    if (clampedScore >= 70) label = 'Critical';
    else if (clampedScore >= 45) label = 'High';
    else if (clampedScore >= 25) label = 'Medium';

    // Generated simulated red flags
    const simulatedFlags = [];
    if (costInflationPercent > 10) {
      simulatedFlags.push({
        type: 'COST_OVERBILLING',
        severity: costInflationPercent > 30 ? 'red' : 'yellow',
        text: `Billed invoice exceeds sanctioned ceiling by ${costInflationPercent}% (+${formatINR(costExcess)}).`,
      });
    }
    if (physicalUnderdeliveryPercent > 5) {
      simulatedFlags.push({
        type: 'GHOST_INFRASTRUCTURE',
        severity: physicalUnderdeliveryPercent > 20 ? 'red' : 'yellow',
        text: `${physicalUnderdeliveryPercent}% of sanctioned physical works unverified on ground (Estimated Public Waste: ${formatINR(ghostWasteINR)}).`,
      });
    }
    if (gpsDeviationMeters > 300) {
      simulatedFlags.push({
        type: 'GEOSPATIAL_FRAUD',
        severity: gpsDeviationMeters > 1000 ? 'red' : 'yellow',
        text: `Site evidence coordinates recorded ${gpsDeviationMeters}m outside sanctioned tender corridor.`,
      });
    }
    if (bidderCartelMarginPercent > 10) {
      simulatedFlags.push({
        type: 'CARTEL_BID_RIGGING',
        severity: 'red',
        text: `Suspicious bidding pattern with dummy bidders inflating tender margin by ${bidderCartelMarginPercent}%.`,
      });
    }

    return {
      simulatedBilledCost,
      costExcess,
      simulatedActualQty,
      ghostQty,
      ghostWasteINR,
      score: clampedScore,
      label,
      flags: simulatedFlags,
    };
  }, [
    baseCost,
    baseQty,
    costInflationPercent,
    physicalUnderdeliveryPercent,
    gpsDeviationMeters,
    bidderCartelMarginPercent,
    project,
  ]);

  const scoreColor = riskScoreColor(sim.score);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4 border-stone-200 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-brand-dark flex items-center justify-center text-brand-surface font-bold shadow-sm">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-dark flex items-center gap-2">
              Forensic Scam Simulator & Stress-Testing Sandbox
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-brand-accent border border-amber-200">
                Interactive Anomaly Injection
              </span>
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Inject synthetic overbilling, ghost construction, or GPS geofence breaches to test
              detection models live.
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-stone-300 hover:bg-stone-100 text-xs font-semibold text-brand-dark transition-all active:scale-95 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Parameters
        </button>
      </div>

      {/* Main Grid: Parameter Controls (Left) vs Live Impact Telemetry (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Anomaly Sliders (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Parameter 1: Cost Inflation / Overbilling */}
          <div className="glass-card p-5 border-stone-200 shadow-sm space-y-3 bg-white/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-brand-dark">
                <Receipt className="w-4 h-4 text-amber-700" />
                <span>Invoice Rate / Cost Inflation</span>
              </div>
              <span
                className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full ${costInflationPercent > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-stone-100 text-stone-700'}`}
              >
                {costInflationPercent > 0
                  ? `+${costInflationPercent}%`
                  : `${costInflationPercent}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="100"
              step="5"
              value={costInflationPercent}
              onChange={(e) => setCostInflationPercent(Number(e.target.value))}
              className="w-full accent-amber-800 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-brand-muted">
              <span>-20% (Under-budget)</span>
              <span className="font-mono font-semibold text-brand-dark">
                Billed: {formatINR(sim.simulatedBilledCost)}
              </span>
              <span>+100% (Double billed)</span>
            </div>
          </div>

          {/* Parameter 2: Ghost Construction / Unbuilt Quantity */}
          <div className="glass-card p-5 border-stone-200 shadow-sm space-y-3 bg-white/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-brand-dark">
                <FileSpreadsheet className="w-4 h-4 text-amber-700" />
                <span>Ghost Infrastructure (Unbuilt Physical Deficit)</span>
              </div>
              <span
                className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full ${physicalUnderdeliveryPercent > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-stone-100 text-stone-700'}`}
              >
                {physicalUnderdeliveryPercent}% Unbuilt
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={physicalUnderdeliveryPercent}
              onChange={(e) => setPhysicalUnderdeliveryPercent(Number(e.target.value))}
              className="w-full accent-rose-700 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-brand-muted">
              <span>0% (100% Built)</span>
              <span className="font-mono font-semibold text-brand-dark">
                Verified: {sim.simulatedActualQty.toFixed(1)} {baseUnit}
              </span>
              <span>80% (Severe Ghost Works)</span>
            </div>
          </div>

          {/* Parameter 3: GPS Inspection Coordinate Distortion */}
          <div className="glass-card p-5 border-stone-200 shadow-sm space-y-3 bg-white/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-brand-dark">
                <MapPin className="w-4 h-4 text-amber-700" />
                <span>Geofence Displacement (Fake Site Coordinates)</span>
              </div>
              <span
                className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full ${gpsDeviationMeters > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-stone-100 text-stone-700'}`}
              >
                {gpsDeviationMeters} meters
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={gpsDeviationMeters}
              onChange={(e) => setGpsDeviationMeters(Number(e.target.value))}
              className="w-full accent-amber-800 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-brand-muted">
              <span>0m (Exact GPS Route)</span>
              <span className="font-mono font-semibold text-brand-dark">
                Geofence Threshold: 250m
              </span>
              <span>5,000m (Out-of-boundary)</span>
            </div>
          </div>

          {/* Parameter 4: Dummy Bidder Cartel Margin */}
          <div className="glass-card p-5 border-stone-200 shadow-sm space-y-3 bg-white/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-brand-dark">
                <Scale className="w-4 h-4 text-amber-700" />
                <span>Cartel Tender Bid-Rigging Margin</span>
              </div>
              <span
                className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full ${bidderCartelMarginPercent > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-stone-100 text-stone-700'}`}
              >
                +{bidderCartelMarginPercent}% Premium
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={bidderCartelMarginPercent}
              onChange={(e) => setBidderCartelMarginPercent(Number(e.target.value))}
              className="w-full accent-amber-800 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-brand-muted">
              <span>0% (Fair Open Competition)</span>
              <span className="font-mono font-semibold text-brand-dark">Cover Bid Premium</span>
              <span>+50% (Bid Rigging)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Recalculated Risk Gauge & Impact Dossier (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Dynamic Score Card */}
          <div className="glass-card p-6 border-2 border-stone-300 shadow-xl bg-white text-center relative overflow-hidden">
            <div className="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-2">
              Recalculated Anomaly Score
            </div>

            <div className="my-3 flex items-center justify-center">
              <span
                className="text-6xl font-black font-mono tracking-tight"
                style={{ color: scoreColor }}
              >
                {sim.score}
              </span>
              <span className="text-xl font-mono text-stone-400 font-bold ml-1">/100</span>
            </div>

            <div
              className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold uppercase font-mono shadow-sm"
              style={{
                backgroundColor: `${scoreColor}18`,
                color: scoreColor,
                border: `1px solid ${scoreColor}40`,
              }}
            >
              {sim.score >= 70 ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              {sim.label} Risk Severity
            </div>

            {/* Estimated Public Waste Meter */}
            <div className="mt-6 pt-5 border-t border-stone-200 grid grid-cols-2 gap-3 text-left">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div className="text-[10px] uppercase font-bold text-stone-500">
                  Unjust Public Drain
                </div>
                <div className="text-sm font-mono font-bold text-rose-600 mt-0.5">
                  {formatINR(Math.max(0, sim.costExcess) + sim.ghostWasteINR)}
                </div>
              </div>
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div className="text-[10px] uppercase font-bold text-stone-500">
                  Active Violations
                </div>
                <div className="text-sm font-mono font-bold text-brand-dark mt-0.5">
                  {sim.flags.length} Red Flags
                </div>
              </div>
            </div>
          </div>

          {/* Triggered Red Flags in Real Time */}
          <div className="glass-card p-5 border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" /> Real-Time Triggered Flags (
                {sim.flags.length})
              </span>
            </div>

            {sim.flags.length === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All parameters within legal statutory tolerances.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {sim.flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs leading-snug ${
                      flag.severity === 'red'
                        ? 'bg-rose-50 border-rose-200 text-rose-950 font-medium'
                        : 'bg-amber-50 border-amber-200 text-amber-950 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                      <span className="uppercase text-stone-700">{flag.type}</span>
                      <span
                        className={flag.severity === 'red' ? 'text-rose-600' : 'text-amber-600'}
                      >
                        {flag.severity.toUpperCase()}
                      </span>
                    </div>
                    {flag.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
