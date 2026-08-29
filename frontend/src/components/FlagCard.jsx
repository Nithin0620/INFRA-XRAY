import { severityBadgeClass, cn } from '../lib/utils';
import { AlertTriangle, CheckCircle, XCircle, Eye, MapPin, BarChart3, Brain } from 'lucide-react';

const moduleIcons = {
  cross_verification: BarChart3,
  computer_vision: Eye,
  geospatial: MapPin,
  ml_anomaly: Brain,
};

const moduleLabels = {
  cross_verification: 'Cross-Verification',
  computer_vision: 'Computer Vision',
  geospatial: 'Geospatial',
  ml_anomaly: 'ML Anomaly',
};

export default function FlagCard({ flag, onFeedback, feedbackStatus }) {
  const Icon = moduleIcons[flag.source_module] || AlertTriangle;

  return (
    <div
      className={cn(
        'glass-card p-5 transition-all',
        flag.severity === 'red' && 'border-red-500/20 bg-red-500/[0.03]',
        flag.severity === 'yellow' && 'border-yellow-500/20 bg-yellow-500/[0.03]'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <span className={severityBadgeClass(flag.severity)}>
              {flag.severity === 'red' ? (
                <XCircle className="w-3 h-3" />
              ) : flag.severity === 'yellow' ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <CheckCircle className="w-3 h-3" />
              )}
              {flag.severity}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 rounded-full px-2.5 py-0.5">
              <Icon className="w-3 h-3" />
              {moduleLabels[flag.source_module] || flag.source_module}
            </span>
            {flag.category && (
              <span className="text-xs text-gray-500 font-mono">{flag.category}</span>
            )}
          </div>

          {/* Message */}
          <p className="text-sm text-gray-300 leading-relaxed">{flag.message}</p>

          {/* Deviation */}
          {flag.deviation_percent != null && (
            <div className="mt-2 text-xs text-gray-500">
              Deviation:{' '}
              <span
                className={
                  flag.deviation_percent > 10
                    ? 'text-red-400 font-semibold'
                    : flag.deviation_percent > 5
                      ? 'text-yellow-400 font-semibold'
                      : 'text-green-400'
                }
              >
                {flag.deviation_percent.toFixed(1)}%
              </span>
            </div>
          )}

          {/* Source docs */}
          {flag.documents_involved?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {flag.documents_involved.map((doc) => (
                <span
                  key={doc}
                  className="text-[10px] font-mono bg-white/5 text-gray-400 px-2 py-0.5 rounded"
                >
                  {doc.split('/').pop()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Feedback buttons */}
        {onFeedback && (
          <div className="flex flex-col gap-1.5 shrink-0">
            {feedbackStatus ? (
              <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                ✓ {feedbackStatus}
              </span>
            ) : (
              <>
                <button
                  onClick={() => onFeedback(flag.flag_id, 'confirmed')}
                  className="text-[10px] px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  aria-label="Confirm flag"
                >
                  Confirm
                </button>
                <button
                  onClick={() => onFeedback(flag.flag_id, 'false_positive')}
                  className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  aria-label="Mark flag as false positive"
                >
                  False Positive
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
