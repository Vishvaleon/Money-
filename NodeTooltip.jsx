import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Activity, Link2, Zap } from 'lucide-react';

const patternIcons = {
  cycle: Link2,
  fan_in: Activity,
  fan_out: Activity,
  layered_shell: Link2,
  high_velocity: Zap
};

const patternLabels = {
  cycle_length_3: 'Cycle (3 nodes)',
  cycle_length_4: 'Cycle (4 nodes)',
  cycle_length_5: 'Cycle (5 nodes)',
  fan_in: 'Fan-In Pattern',
  fan_out: 'Fan-Out Pattern',
  layered_shell: 'Layered Shell',
  high_velocity: 'High Velocity'
};

export default function NodeTooltip({ node }) {
  if (!node) return null;

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-yellow-400';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 shadow-2xl min-w-[280px]"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Account ID</p>
            <h3 className="text-lg font-semibold text-white font-mono">{node.id}</h3>
          </div>
          {node.suspicious && (
            <div className="p-2 bg-red-500/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          )}
        </div>

        {node.suspicious && (
          <>
            <div className="mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Suspicion Score</p>
              <div className="flex items-end gap-2">
                <span className={`text-3xl font-bold ${getScoreColor(node.suspicion_score)}`}>
                  {node.suspicion_score}
                </span>
                <span className="text-slate-500 text-sm mb-1">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${node.suspicion_score}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    node.suspicion_score >= 70 ? 'bg-red-500' :
                    node.suspicion_score >= 40 ? 'bg-orange-500' : 'bg-yellow-500'
                  }`}
                />
              </div>
            </div>

            {node.detected_patterns?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Detected Patterns</p>
                <div className="flex flex-wrap gap-2">
                  {node.detected_patterns.map((pattern, idx) => {
                    const basePattern = pattern.replace(/_length_\d/, '');
                    const Icon = patternIcons[basePattern] || AlertTriangle;
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-slate-300"
                      >
                        <Icon className="w-3 h-3" />
                        {patternLabels[pattern] || pattern}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {node.ring_id && (
              <div className="pt-3 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fraud Ring</p>
                <span 
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{ 
                    backgroundColor: `${node.color}20`,
                    color: node.color
                  }}
                >
                  {node.ring_id}
                </span>
              </div>
            )}
          </>
        )}

        {!node.suspicious && (
          <p className="text-slate-500 text-sm">No suspicious activity detected</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}