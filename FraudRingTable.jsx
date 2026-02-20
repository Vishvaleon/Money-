import React from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, Link2, Activity, Zap, Shield } from 'lucide-react';

const patternConfig = {
  cycle: { icon: Link2, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  layered_shell: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  fan_in: { icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  fan_out: { icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  high_velocity: { icon: Zap, color: 'text-red-400', bg: 'bg-red-500/20' }
};

export default function FraudRingTable({ fraudRings }) {
  if (!fraudRings?.length) {
    return (
      <div className="bg-slate-900/50 rounded-2xl p-8 text-center">
        <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Fraud Rings Detected</h3>
        <p className="text-slate-400">All transaction patterns appear normal</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-700/50">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Ring ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pattern Type
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Member Count
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Risk Score
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Member Account IDs
              </th>
            </tr>
          </thead>
          <tbody>
            {fraudRings.map((ring, idx) => {
              const config = patternConfig[ring.pattern_type] || patternConfig.cycle;
              const Icon = config.icon;
              
              return (
                <motion.tr
                  key={ring.ring_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="font-mono text-sm text-white">{ring.ring_id}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 ${config.bg} rounded-lg`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <span className={`text-sm font-medium ${config.color}`}>
                        {ring.pattern_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-lg">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-white font-medium">{ring.member_accounts.length}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className={`text-lg font-bold ${
                        ring.risk_score >= 70 ? 'text-red-400' :
                        ring.risk_score >= 40 ? 'text-orange-400' : 'text-yellow-400'
                      }`}>
                        {ring.risk_score}
                      </span>
                      <div className="w-16 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            ring.risk_score >= 70 ? 'bg-red-500' :
                            ring.risk_score >= 40 ? 'bg-orange-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${ring.risk_score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-md">
                      {ring.member_accounts.slice(0, 5).map((account) => (
                        <span
                          key={account}
                          className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-slate-300"
                        >
                          {account}
                        </span>
                      ))}
                      {ring.member_accounts.length > 5 && (
                        <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">
                          +{ring.member_accounts.length - 5} more
                        </span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}