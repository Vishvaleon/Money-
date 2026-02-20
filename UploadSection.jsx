import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UploadSection({ onFileSelect, file, onClear, isProcessing, error }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      onFileSelect(droppedFile);
    }
  }, [onFileSelect]);

  const handleFileInput = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <label
              htmlFor="csv-upload"
              className={`
                relative flex flex-col items-center justify-center w-full h-48
                border-2 border-dashed rounded-2xl cursor-pointer
                transition-all duration-300 ease-out
                ${isDragging 
                  ? 'border-blue-400 bg-blue-500/10' 
                  : 'border-slate-600 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-900/70'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ 
                    scale: isDragging ? 1.1 : 1,
                    y: isDragging ? -5 : 0
                  }}
                  className={`
                    p-4 rounded-2xl transition-colors
                    ${isDragging ? 'bg-blue-500/20' : 'bg-slate-800'}
                  `}
                >
                  <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`} />
                </motion.div>
                <div className="text-center">
                  <p className="text-slate-300 font-medium">
                    {isDragging ? 'Drop your CSV here' : 'Drop your CSV file here'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">or click to browse</p>
                </div>
              </div>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>

            {/* Format hint */}
            <div className="mt-4 p-4 bg-slate-900/30 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Required CSV Format</p>
              <code className="text-xs text-slate-400 font-mono">
                transaction_id, sender_id, receiver_id, amount, timestamp
              </code>
              <p className="text-xs text-slate-500 mt-2">
                Timestamp format: YYYY-MM-DD HH:MM:SS
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <div className={`
              flex items-center justify-between p-5 rounded-2xl border
              ${error 
                ? 'bg-red-500/10 border-red-500/30' 
                : 'bg-slate-900/50 border-slate-700/50'
              }
            `}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${error ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                  {error ? (
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  ) : isProcessing ? (
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  ) : (
                    <FileText className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-slate-500 text-sm">
                    {error || (isProcessing ? 'Processing...' : `${(file.size / 1024).toFixed(1)} KB`)}
                  </p>
                </div>
              </div>
              
              {!isProcessing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClear}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}