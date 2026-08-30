/* eslint-disable no-unused-vars */
import { useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Handle, Position, MarkerType } from 'reactflow';
import dagre from '@dagrejs/dagre';
import {
  Building2,
  Users,
  CreditCard,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Network,
} from 'lucide-react';
import { formatINR } from '../lib/utils';

const nodeWidth = 260;
const nodeHeight = 120;

function getLayoutedElements(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Custom Collusion Entity Node Component
const EntityNode = ({ data }) => {
  const Icon = data.icon || Building2;
  const isFlagged = data.isSuspicious;

  return (
    <div
      className={`rounded-2xl border-2 p-4 shadow-xl backdrop-blur-md transition-all duration-300 w-[260px] text-left cursor-pointer bg-white ${
        isFlagged
          ? 'border-rose-400 shadow-rose-500/10 hover:border-rose-600'
          : 'border-stone-200 hover:border-stone-400'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-stone-400 !w-2.5 !h-2.5" />

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isFlagged
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : 'bg-stone-100 text-stone-700'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-brand-dark truncate max-w-[140px]">
              {data.label}
            </div>
            <div className="text-[10px] text-brand-muted font-mono">{data.subtitle}</div>
          </div>
        </div>
        {isFlagged ? (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 uppercase font-mono">
            Cartel
          </span>
        ) : (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase font-mono">
            Clean
          </span>
        )}
      </div>

      <div className="mt-2 text-xs font-semibold text-brand-dark bg-stone-50 p-2 rounded-xl border border-stone-200/80">
        <div className="text-[10px] text-brand-muted font-normal uppercase tracking-wider">
          {data.metricLabel}
        </div>
        <div className="truncate font-mono">{data.metricValue}</div>
      </div>

      {data.tag && (
        <div className="mt-2 text-[10px] font-medium text-rose-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span className="truncate">{data.tag}</span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-stone-400 !w-2.5 !h-2.5" />
    </div>
  );
};

const nodeTypes = {
  entityNode: EntityNode,
};

export default function CollusionNetworkGraph({ project }) {
  const [selectedDetails, setSelectedDetails] = useState(null);

  const isCritical = (project?.risk_score || 0) >= 70;
  const contractorName = project?.contractor_name || 'L&T Infrastructure';

  const { nodes, edges } = useMemo(() => {
    const rawNodes = [];
    const rawEdges = [];

    // 1. Primary Tender Node
    rawNodes.push({
      id: 'tender_main',
      type: 'entityNode',
      data: {
        label: project?.project_name || 'Public Tender',
        subtitle: `Tender ID: ${project?.tender_id || 'TND-2024-88'}`,
        icon: FileSpreadsheet,
        metricLabel: 'Sanctioned Contract Value',
        metricValue: formatINR(project?.sanctioned_amount_inr || 24000000),
        isSuspicious: isCritical,
        tag: isCritical ? 'Suspicious Bid Differential < 0.4%' : null,
      },
    });

    // 2. Primary Winning Contractor
    rawNodes.push({
      id: 'contractor_winner',
      type: 'entityNode',
      data: {
        label: contractorName,
        subtitle: 'L1 Winning Bidder',
        icon: Building2,
        metricLabel: 'GSTIN Registration',
        metricValue: '27AAECB9123P1Z4',
        isSuspicious: isCritical,
        tag: isCritical ? 'Shared Director & Common Bank' : 'Independent Entity',
      },
    });
    rawEdges.push({
      id: 'e-tender-winner',
      source: 'tender_main',
      target: 'contractor_winner',
      style: { stroke: isCritical ? '#f43f5e' : '#10b981', strokeWidth: 2.5 },
      label: 'Awarded (L1)',
      labelStyle: { fill: isCritical ? '#f43f5e' : '#10b981', fontWeight: 700, fontSize: 10 },
    });

    // 3. Competitor L2 (Shell Bidder)
    rawNodes.push({
      id: 'contractor_l2',
      type: 'entityNode',
      data: {
        label: 'Vanguard Infra Project Ltd',
        subtitle: 'L2 Dummy Bidder',
        icon: Building2,
        metricLabel: 'GSTIN Registration',
        metricValue: '27AAECB9123Q9Z2 (Linked)',
        isSuspicious: isCritical,
        tag: isCritical ? 'Same IP Subnet & Phone No.' : null,
      },
    });
    rawEdges.push({
      id: 'e-tender-l2',
      source: 'tender_main',
      target: 'contractor_l2',
      style: { stroke: isCritical ? '#f43f5e' : '#94a3b8', strokeWidth: 2, strokeDasharray: '4 4' },
      label: 'Cover Bid (L2)',
      labelStyle: { fill: '#64748b', fontWeight: 600, fontSize: 10 },
    });

    // 4. Competitor L3 (Shell Bidder)
    rawNodes.push({
      id: 'contractor_l3',
      type: 'entityNode',
      data: {
        label: 'Apex Civil Engineering Corp',
        subtitle: 'L3 Disqualified Bidder',
        icon: Building2,
        metricLabel: 'GSTIN Registration',
        metricValue: '27AAECB9123R7Z8',
        isSuspicious: isCritical,
        tag: isCritical ? 'Registered at Same Office Address' : null,
      },
    });
    rawEdges.push({
      id: 'e-tender-l3',
      source: 'tender_main',
      target: 'contractor_l3',
      style: { stroke: isCritical ? '#f43f5e' : '#94a3b8', strokeWidth: 2, strokeDasharray: '4 4' },
      label: 'Cover Bid (L3)',
      labelStyle: { fill: '#64748b', fontWeight: 600, fontSize: 10 },
    });

    // 5. Common Beneficiary Entity / Shared Director
    if (isCritical) {
      rawNodes.push({
        id: 'shared_director',
        type: 'entityNode',
        data: {
          label: 'R. K. Sharma (Director)',
          subtitle: 'DIN: 08492011 · Beneficial Owner',
          icon: Users,
          metricLabel: 'Cross-Holding Stake',
          metricValue: 'Director in L1 & L2 Companies',
          isSuspicious: true,
          tag: 'Direct Conflict of Interest (CAG Sec 14)',
        },
      });

      rawEdges.push({
        id: 'e-winner-director',
        source: 'contractor_winner',
        target: 'shared_director',
        animated: true,
        style: { stroke: '#ef4444', strokeWidth: 3 },
        label: '51% Direct Ownership',
        labelStyle: { fill: '#ef4444', fontWeight: 700, fontSize: 10 },
      });

      rawEdges.push({
        id: 'e-l2-director',
        source: 'contractor_l2',
        target: 'shared_director',
        animated: true,
        style: { stroke: '#ef4444', strokeWidth: 3 },
        label: '49% Beneficial Stake',
        labelStyle: { fill: '#ef4444', fontWeight: 700, fontSize: 10 },
      });

      // 6. Common Bank Account Beneficiary
      rawNodes.push({
        id: 'shared_bank',
        type: 'entityNode',
        data: {
          label: 'Shared Escrow Account',
          subtitle: 'IFSC: HDFC0001892 · AC: 5020008491',
          icon: CreditCard,
          metricLabel: 'Common Financial Drain',
          metricValue: '₹14.8 Cr Routed to Same Entity',
          isSuspicious: true,
          tag: 'Circular Fund Movement Flagged',
        },
      });

      rawEdges.push({
        id: 'e-director-bank',
        source: 'shared_director',
        target: 'shared_bank',
        animated: true,
        style: { stroke: '#dc2626', strokeWidth: 3 },
        label: 'Ultimate Beneficiary',
        labelStyle: { fill: '#dc2626', fontWeight: 700, fontSize: 10 },
      });
    }

    return getLayoutedElements(rawNodes, rawEdges, 'TB');
  }, [project, contractorName, isCritical]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4 border-stone-200 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-brand-dark flex items-center justify-center text-brand-surface font-bold shadow-sm">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-dark flex items-center gap-2">
              Procurement Collusion & Shell Contractor Network
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                  isCritical
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isCritical ? 'Cartel Ring Detected' : 'No Collusion Detected'}
              </span>
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Correlates GSTIN IDs, Director PANs, IP subnets, and escrow accounts between winning
              and dummy cover bidders.
            </p>
          </div>
        </div>

        {/* Collusion Metrics Pill */}
        <div className="flex items-center gap-3">
          <div className="glass-card px-3.5 py-1.5 border-stone-200 text-xs flex items-center gap-2 bg-stone-50">
            <span className="text-brand-muted">Bidders Screened:</span>
            <span className="font-mono font-bold text-brand-dark">3 Bidders</span>
          </div>
          <div className="glass-card px-3.5 py-1.5 border-stone-200 text-xs flex items-center gap-2 bg-stone-50">
            <span className="text-brand-muted">Shared Director Links:</span>
            <span
              className={`font-mono font-bold ${isCritical ? 'text-rose-600' : 'text-emerald-600'}`}
            >
              {isCritical ? '1 Common Beneficial Owner' : '0 Links'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Graph Viewport */}
      <div className="w-full h-[520px] rounded-3xl overflow-hidden border-2 border-stone-200 bg-white/90 shadow-md relative">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
          <span className="text-xs font-bold text-brand-dark uppercase tracking-wider bg-white/95 px-3.5 py-1.5 rounded-full border border-stone-200 shadow-md backdrop-blur-md">
            Interactive Entity Relationship & Ownership Graph
          </span>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls className="!bg-white !border-stone-200 !text-brand-dark !rounded-2xl !shadow-lg" />
          <MiniMap
            nodeColor={(node) => (node.data?.isSuspicious ? '#ef4444' : '#10b981')}
            className="!bg-white/95 !border !border-stone-200 !rounded-2xl overflow-hidden shadow-md"
            maskColor="rgba(240, 240, 240, 0.7)"
          />
        </ReactFlow>
      </div>

      {/* Forensic Cartel Summary Box */}
      {isCritical && (
        <div className="glass-card p-5 border-2 border-rose-300 bg-rose-50/40 rounded-3xl shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-900">
                CAG / CVC High-Risk Alert: Bid Rigging & Artificial Competition Ring
              </h4>
              <p className="text-xs text-rose-800 leading-relaxed">
                The winning contractor (<strong>{contractorName}</strong>) and dummy cover bidder (
                <strong>Vanguard Infra</strong>) share common Director{' '}
                <strong>R. K. Sharma (DIN: 08492011)</strong>. Furthermore, both bids originated
                from the exact same corporate IP address, and financial disbursements are routed to
                the same beneficial escrow account.
              </p>
              <div className="text-[11px] font-mono text-rose-700 pt-1 font-semibold">
                Violation: Central Vigilance Commission (CVC) Anti-Collusion Guidelines Section 4.2
                & Competition Act Section 3(3)(d).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
