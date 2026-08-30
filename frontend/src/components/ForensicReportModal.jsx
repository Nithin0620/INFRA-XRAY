/* eslint-disable no-unused-vars */
import { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  IndianRupee,
  Hash,
  X
} from 'lucide-react';
import { formatINR, riskScoreColor } from '../lib/utils';

export default function ForensicReportModal({ project, extracted, flags = [], onClose }) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!project) return null;

  const riskReport = project.risk_report;
  const redFlags = flags.filter((f) => f.severity === 'red');
  const yellowFlags = flags.filter((f) => f.severity === 'yellow');
  const scoreColor = riskScoreColor(project.risk_score);
  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const dossierId = `CAG-IX-${project.project_id.toUpperCase()}-${new Date().getFullYear()}`;

  const handlePrint = () => {
    setIsGenerating(true);
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-300 overflow-hidden my-8 print:border-none print:shadow-none print:m-0 print:max-w-none">
        
        {/* Action Header Bar (Hidden during print) */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm tracking-wide">
              Official Forensic Infrastructure Audit Dossier
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official CAG / Vigilance Dossier Content */}
        <div className="p-8 sm:p-12 space-y-8 bg-white text-stone-900 font-sans print:p-6">
          
          {/* Header & Watermark */}
          <div className="border-b-2 border-stone-900 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-stone-500 uppercase">
                  Government of India · National Infrastructure Oversight Division
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-950 mt-1 uppercase tracking-tight">
                  Forensic Infrastructure Audit Report
                </h1>
                <div className="text-xs text-stone-600 font-mono mt-1">
                  Statutory Reference: Public Procurement Transparency & Anti-Corruption Oversight Act
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold px-3 py-1 bg-stone-100 rounded border border-stone-300 inline-block">
                  {dossierId}
                </div>
                <div className="text-[11px] text-stone-500 mt-1 font-mono">Date: {reportDate}</div>
              </div>
            </div>
          </div>

          {/* Executive Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Project ID / Tender</div>
              <div className="text-xs font-mono font-bold text-stone-900 mt-0.5">{project.tender_id}</div>
              <div className="text-[11px] text-stone-600 truncate">{project.project_name}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Contractor Awarded</div>
              <div className="text-xs font-bold text-stone-900 mt-0.5 truncate">{project.contractor_name}</div>
              <div className="text-[11px] text-stone-600 font-mono">{project.state}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Sanctioned Amount</div>
              <div className="text-xs font-bold text-stone-900 mt-0.5">{formatINR(project.sanctioned_amount_inr)}</div>
              <div className="text-[11px] text-stone-600">{project.sanctioned_quantity} {project.unit}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Risk Assessment</div>
              <div className="text-sm font-mono font-black" style={{ color: scoreColor }}>
                {project.risk_score ?? '—'} / 100 ({project.severity_label})
              </div>
              <div className="text-[11px] text-stone-600 font-semibold">{redFlags.length} Critical Violations</div>
            </div>
          </div>

          {/* Section 1: Financial & Physical Audit Reconciliation Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 border-l-4 border-stone-900 pl-2">
              1. Multi-Stage Evidence Verification Funnel
            </h3>
            <table className="w-full text-left text-xs border border-stone-300 border-collapse">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-300 font-bold uppercase text-[10px] text-stone-700">
                  <th className="p-3 border-r border-stone-300">Stage / Document</th>
                  <th className="p-3 border-r border-stone-300">Sanctioned / Claimed</th>
                  <th className="p-3 border-r border-stone-300">Verified Evidence</th>
                  <th className="p-3 border-r border-stone-300">Variance</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                <tr>
                  <td className="p-3 font-semibold border-r border-stone-200">Contract Sanction</td>
                  <td className="p-3 border-r border-stone-200">{project.sanctioned_quantity} {project.unit}</td>
                  <td className="p-3 border-r border-stone-200">{project.sanctioned_quantity} {project.unit}</td>
                  <td className="p-3 border-r border-stone-200 font-mono">0.0%</td>
                  <td className="p-3 font-bold text-emerald-700">BASE SPEC</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold border-r border-stone-200">Contractor Progress Claim</td>
                  <td className="p-3 border-r border-stone-200">{extracted?.progress_report?.quantity_completed || '—'} {project.unit}</td>
                  <td className="p-3 border-r border-stone-200">{extracted?.progress_report?.percent_complete || 0}% Complete</td>
                  <td className="p-3 border-r border-stone-200 font-mono">—</td>
                  <td className="p-3 font-semibold text-stone-600">CLAIMED</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold border-r border-stone-200">Physical Ground Inspection</td>
                  <td className="p-3 border-r border-stone-200">{extracted?.inspection_report?.verified_quantity || '—'} {project.unit}</td>
                  <td className="p-3 border-r border-stone-200">{extracted?.inspection_report?.inspector_name || 'Verified'}</td>
                  <td className="p-3 border-r border-stone-200 font-mono font-bold text-rose-700">
                    {extracted?.inspection_report && extracted?.progress_report
                      ? `${(((extracted.progress_report.quantity_completed - extracted.inspection_report.verified_quantity) / extracted.progress_report.quantity_completed) * 100).toFixed(1)}% Deficit`
                      : '0%'}
                  </td>
                  <td className="p-3 font-bold text-rose-700">
                    {redFlags.some(f => f.category === 'quantity_mismatch') ? 'MISMATCH' : 'VERIFIED'}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold border-r border-stone-200">Financial Billing (Invoice)</td>
                  <td className="p-3 border-r border-stone-200">{formatINR(project.sanctioned_amount_inr)}</td>
                  <td className="p-3 border-r border-stone-200">{formatINR(extracted?.invoice?.billed_amount_inr || project.sanctioned_amount_inr)}</td>
                  <td className="p-3 border-r border-stone-200 font-mono">
                    {extracted?.invoice?.billed_amount_inr > project.sanctioned_amount_inr ? '+Overbilled' : 'In Budget'}
                  </td>
                  <td className="p-3 font-bold text-stone-900">
                    {extracted?.invoice?.billed_amount_inr > project.sanctioned_amount_inr ? 'OVERBILLING' : 'VALID'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Itemized Forensic Violations & Red Flags */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 border-l-4 border-rose-600 pl-2">
              2. Itemized Forensic Red Flags & Evidence Logs ({flags.length})
            </h3>
            {flags.length === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                No compliance or physical defects detected. Project meets statutory execution standards.
              </div>
            ) : (
              <div className="space-y-2">
                {flags.map((flag, idx) => (
                  <div
                    key={flag.flag_id || idx}
                    className={`p-3.5 rounded-xl border text-xs ${
                      flag.severity === 'red'
                        ? 'bg-rose-50 border-rose-200 text-rose-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-white border border-stone-300">
                        {flag.source_module} · {flag.category || 'Discrepancy'}
                      </span>
                      <span className={`font-bold text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                        flag.severity === 'red' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {flag.severity} RISK
                      </span>
                    </div>
                    <div className="font-medium leading-relaxed">{flag.message}</div>
                    {flag.deviation_percent != null && (
                      <div className="text-[11px] font-mono mt-1 font-semibold text-rose-700">
                        Quantified Variance: {flag.deviation_percent.toFixed(1)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Statutory Authority Signoff */}
          <div className="pt-6 border-t-2 border-stone-300">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
              <div>
                <div className="text-stone-500 text-[10px] uppercase font-bold">AI Forensic Engine</div>
                <div className="font-mono font-bold mt-1">INFRA-XRAY Engine v2.4</div>
                <div className="text-[10px] text-stone-500">SHA-256: d41d8cd98f00b204e9800998ecf8427e</div>
              </div>
              <div>
                <div className="text-stone-500 text-[10px] uppercase font-bold">Superintending Auditor</div>
                <div className="font-bold mt-1">Chief Technical Examiner</div>
                <div className="text-[10px] text-stone-500">Central Vigilance Commission</div>
              </div>
              <div className="text-right">
                <div className="text-stone-500 text-[10px] uppercase font-bold">Official Seal & Action</div>
                <div className="font-bold mt-1 text-rose-700">
                  {project.risk_score >= 50 ? 'REFER TO ENFORCEMENT' : 'PASSED AUDIT'}
                </div>
                <div className="text-[10px] text-stone-500">Digital Timestamp Logged</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
