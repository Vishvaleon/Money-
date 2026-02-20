import React from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, Link2, Clock } from 'lucide-react';

const stats = [
  { key: 'total_accounts_analyzed', label: 'Accounts Analyzed', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { key: 'suspicious_accounts_flagged', label: 'Suspicious Accounts', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' },
  { key: 'fraud_rings_detected', label: 'Fraud Rings', icon: Link2, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { key: 'processing_time_seconds', label: 'Processing Time', icon: Clock, color: 'text-green-400', bg: 'bg-green-500/20', suffix: 's' }
];

export default function AnalysisSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const value = summary[stat.key];
        
        return (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${stat.color}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
              {stat.suffix || ''}
            </p>
            <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}