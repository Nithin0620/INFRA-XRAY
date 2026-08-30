/* eslint-disable no-unused-vars */
import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Handle, Position, MarkerType } from 'reactflow';
import dagre from '@dagrejs/dagre';
import {
  FileText,
  Receipt,
  ClipboardCheck,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { formatINR } from '../lib/utils';

const nodeWidth = 240;
const nodeHeight = 110;

function getLayoutedElements(nodes, edges, direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 40, ranksep: 70 });

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
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Custom Node Component for Evidence Documents
const DocumentNode = ({ data }) => {
  const Icon = data.icon || FileText;
  const isFlagged = data.hasFlag;

  return (
    <div
      className={`rounded-xl border p-3.5 shadow-xl backdrop-blur-md transition-all duration-300 w-[240px] text-left cursor-pointer ${
        isFlagged
          ? 'bg-red-950/40 border-red-500/50 shadow-red-500/10 hover:border-red-400'
          : 'bg-white/80 border-brand-100 shadow-black/40 hover:border-brand-500/50'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-brand-400 !w-2 !h-2" />
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isFlagged ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/20 text-brand-400'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-brand-text truncate max-w-[130px]">
              {data.label}
            </div>
            <div className="text-[10px] text-brand-muted font-mono truncate">{data.sourceFile}</div>
          </div>
        </div>
        {isFlagged ? (
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
        )}
      </div>

      <div className="mt-2 text-xs font-semibold text-brand-text bg-white/30 px-2 py-1 rounded border border-brand-50 truncate">
        {data.value}
      </div>

      {data.subtext && (
        <div className="mt-1 text-[11px] text-brand-muted truncate">{data.subtext}</div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-brand-400 !w-2 !h-2" />
    </div>
  );
};

// Node types registry
const nodeTypes = {
  documentNode: DocumentNode,
};

export default function EvidenceGraph({ project, extracted, flags = [] }) {
  const { nodes, edges } = useMemo(() => {
    if (!project || !extracted) return { nodes: [], edges: [] };

    const rawNodes = [];
    const rawEdges = [];

    const redFlags = flags.filter((f) => f.severity === 'red');
    const hasQuantityMismatch = flags.some((f) => f.category === 'quantity_mismatch');
    const hasCostMismatch = flags.some(
      (f) => f.category === 'cost_overrun' || f.category === 'unit_rate_inflation'
    );
    const hasGeoMismatch = flags.some((f) => f.source_module === 'geospatial');
    const hasVisionDamage = flags.some((f) => f.source_module === 'computer_vision');

    // 1. Contract Node
    rawNodes.push({
      id: 'contract',
      type: 'documentNode',
      data: {
        label: 'Contract Sanction',
        sourceFile: 'Contract.pdf',
        icon: FileText,
        value: `${project.sanctioned_quantity} ${project.unit}`,
        subtext: `Sanctioned: ${formatINR(project.sanctioned_amount_inr)}`,
        hasFlag: false,
      },
    });

    // 2. BOQ Node
    if (extracted.boq) {
      rawNodes.push({
        id: 'boq',
        type: 'documentNode',
        data: {
          label: 'Bill of Quantities',
          sourceFile: 'BOQ.pdf',
          icon: Receipt,
          value: formatINR(extracted.boq.boq_total_inr),
          subtext: `${extracted.boq.line_items?.length || 0} Rate Items`,
          hasFlag: hasCostMismatch,
        },
      });
      rawEdges.push({
        id: 'e-contract-boq',
        source: 'contract',
        target: 'boq',
        animated: false,
        style: { stroke: '#4b5563', strokeWidth: 2 },
      });
    }

    // 3. Progress Report Node
    if (extracted.progress_report) {
      rawNodes.push({
        id: 'progress',
        type: 'documentNode',
        data: {
          label: 'Claimed Progress',
          sourceFile: 'ProgressReport.pdf',
          icon: ClipboardCheck,
          value: `${extracted.progress_report.quantity_completed} ${extracted.progress_report.unit} (${extracted.progress_report.percent_complete}%)`,
          subtext: `Period: ${extracted.progress_report.reporting_period || 'N/A'}`,
          hasFlag: hasQuantityMismatch,
        },
      });
      rawEdges.push({
        id: 'e-contract-progress',
        source: 'contract',
        target: 'progress',
        animated: false,
        style: { stroke: '#4b5563', strokeWidth: 2 },
      });
    }

    // 4. Invoice Node
    if (extracted.invoice) {
      rawNodes.push({
        id: 'invoice',
        type: 'documentNode',
        data: {
          label: 'Contractor Invoice',
          sourceFile: 'Invoice.pdf',
          icon: Receipt,
          value: formatINR(extracted.invoice.billed_amount_inr),
          subtext: `Billed: ${extracted.invoice.billed_quantity || '—'} ${project.unit}`,
          hasFlag: hasCostMismatch,
        },
      });
      if (extracted.boq) {
        rawEdges.push({
          id: 'e-boq-invoice',
          source: 'boq',
          target: 'invoice',
          animated: hasCostMismatch,
          style: {
            stroke: hasCostMismatch ? '#ef4444' : '#4b5563',
            strokeWidth: hasCostMismatch ? 3 : 2,
          },
          label: hasCostMismatch ? 'Rate/Cost Flag' : undefined,
          labelStyle: { fill: '#ef4444', fontWeight: 600, fontSize: 10 },
        });
      }
      if (extracted.progress_report) {
        rawEdges.push({
          id: 'e-progress-invoice',
          source: 'progress',
          target: 'invoice',
          animated: false,
          style: { stroke: '#4b5563', strokeWidth: 2 },
        });
      }
    }

    // 5. Physical Inspection Node
    if (extracted.inspection_report) {
      rawNodes.push({
        id: 'inspection',
        type: 'documentNode',
        data: {
          label: 'Ground Inspection',
          sourceFile: 'InspectionReport.pdf',
          icon: MapPin,
          value: `${extracted.inspection_report.verified_quantity} ${extracted.inspection_report.unit}`,
          subtext: `Inspector: ${extracted.inspection_report.inspector_name?.split(',')[0] || 'Verified'}`,
          hasFlag: hasQuantityMismatch || hasGeoMismatch,
        },
      });

      if (extracted.progress_report) {
        rawEdges.push({
          id: 'e-progress-inspection',
          source: 'progress',
          target: 'inspection',
          animated: hasQuantityMismatch,
          style: {
            stroke: hasQuantityMismatch ? '#ef4444' : '#10b981',
            strokeWidth: hasQuantityMismatch ? 3 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: hasQuantityMismatch ? '#ef4444' : '#10b981',
          },
          label: hasQuantityMismatch ? `Mismatch: Claimed vs Ground` : 'Verified',
          labelStyle: {
            fill: hasQuantityMismatch ? '#ef4444' : '#10b981',
            fontWeight: 700,
            fontSize: 10,
          },
        });
      }
    }

    // 6. Site Photos Node
    if (extracted.photos && extracted.photos.length > 0) {
      const damagedPhotos = extracted.photos.filter(
        (p) => p.condition_tag === 'pothole' || p.condition_tag === 'cracking'
      );
      rawNodes.push({
        id: 'photos',
        type: 'documentNode',
        data: {
          label: 'Site Photos (EXIF)',
          sourceFile: `${extracted.photos.length} Captured Images`,
          icon: Camera,
          value: `${extracted.photos.length} Geotagged Photos`,
          subtext:
            damagedPhotos.length > 0
              ? `${damagedPhotos.length} Defect captures`
              : 'Surfaces verified',
          hasFlag: hasVisionDamage,
        },
      });

      if (extracted.inspection_report) {
        rawEdges.push({
          id: 'e-inspection-photos',
          source: 'inspection',
          target: 'photos',
          animated: hasVisionDamage,
          style: {
            stroke: hasVisionDamage ? '#f59e0b' : '#4b5563',
            strokeWidth: 2,
          },
        });
      }
    }

    // 7. Anomaly Engine / Risk Node
    rawNodes.push({
      id: 'risk_engine',
      type: 'documentNode',
      data: {
        label: 'Anomaly Engine',
        sourceFile: 'Risk Verification',
        icon: AlertTriangle,
        value: `Risk: ${project.risk_score ?? '—'}/100`,
        subtext: `${redFlags.length} Critical · ${flags.length - redFlags.length} Warnings`,
        hasFlag: project.risk_score >= 50,
      },
    });

    if (extracted.inspection_report) {
      rawEdges.push({
        id: 'e-inspection-risk',
        source: 'inspection',
        target: 'risk_engine',
        animated: flags.length > 0,
        style: { stroke: project.risk_score >= 50 ? '#ef4444' : '#10b981', strokeWidth: 2.5 },
      });
    }
    if (extracted.invoice) {
      rawEdges.push({
        id: 'e-invoice-risk',
        source: 'invoice',
        target: 'risk_engine',
        animated: hasCostMismatch,
        style: { stroke: hasCostMismatch ? '#ef4444' : '#4b5563', strokeWidth: 2 },
      });
    }

    return getLayoutedElements(rawNodes, rawEdges, 'LR');
  }, [project, extracted, flags]);

  return (
    <div className="w-full h-[460px] rounded-3xl overflow-hidden border border-stone-200 bg-white/90 shadow-md relative">
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <span className="text-xs font-semibold text-brand-dark uppercase tracking-wider bg-white/90 px-3 py-1.5 rounded-full border border-stone-200 shadow-sm backdrop-blur-md">
          Interactive Evidence Traceability Graph
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
          nodeColor={(node) => (node.data?.hasFlag ? '#ef4444' : '#905831')}
          className="!bg-white/95 !border !border-stone-200 !rounded-2xl overflow-hidden shadow-md"
          maskColor="rgba(240, 240, 240, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
