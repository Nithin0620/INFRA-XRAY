/* eslint-disable no-unused-vars */
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatINR } from '../lib/utils';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border border-brand-100 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs">
        <div className="font-bold text-brand-text mb-1">{label}</div>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-brand-text">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.name}:</span>
            <span className="font-mono font-semibold text-brand-text">
              {item.unit === 'INR' ? formatINR(item.value) : `${item.value} ${item.unit || ''}`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProjectAnalyticsChart({ project, extracted }) {
  if (!project || !extracted) return null;

  const unit = project.unit || '';
  const sanctionedQty = Number(project.sanctioned_quantity) || 0;
  const claimedQty = Number(extracted.progress_report?.quantity_completed) || 0;
  const verifiedQty = Number(extracted.inspection_report?.verified_quantity) || 0;

  const quantityData = [
    {
      stage: 'Sanctioned (Contract)',
      quantity: sanctionedQty,
      fill: '#3b82f6',
      unit,
    },
    {
      stage: 'Claimed (Progress)',
      quantity: claimedQty,
      fill: '#06b6d4',
      unit,
    },
    {
      stage: 'Verified (Inspection)',
      quantity: verifiedQty,
      fill: verifiedQty < claimedQty ? '#ef4444' : '#10b981',
      unit,
    },
  ];

  const sanctionedCost = Number(project.sanctioned_amount_inr) || 0;
  const boqTotal = Number(extracted.boq?.boq_total_inr) || sanctionedCost;
  const billedCost = Number(extracted.invoice?.billed_amount_inr) || 0;

  const financialData = [
    {
      stage: 'Sanctioned Budget',
      amount: sanctionedCost,
      fill: '#3b82f6',
      unit: 'INR',
    },
    {
      stage: 'BOQ Total',
      amount: boqTotal,
      fill: '#8b5cf6',
      unit: 'INR',
    },
    {
      stage: 'Invoice Billed',
      amount: billedCost,
      fill: billedCost > sanctionedCost ? '#ef4444' : '#f59e0b',
      unit: 'INR',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quantity Comparison */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-brand-text">Quantity Verification Funnel</h3>
            <p className="text-xs text-brand-muted">
              Contracted vs Progress Claimed vs Physical Ground Audit
            </p>
          </div>
          <span className="text-xs font-mono bg-brand-50 px-2.5 py-1 rounded text-brand-text">
            Unit: {unit}
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quantityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="stage" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantity" name="Quantity" radius={[6, 6, 0, 0]}>
                {quantityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Comparison */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-brand-text">Financial Audit Breakdown</h3>
            <p className="text-xs text-brand-muted">Sanctioned Amount vs BOQ vs Total Billed</p>
          </div>
          <span className="text-xs font-mono bg-brand-50 px-2.5 py-1 rounded text-brand-text">
            INR (₹)
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="stage" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickFormatter={(v) => `₹${(v / 10000000).toFixed(1)}Cr`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" name="Amount" radius={[6, 6, 0, 0]}>
                {financialData.map((entry, index) => (
                  <Cell key={`cell-f-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
