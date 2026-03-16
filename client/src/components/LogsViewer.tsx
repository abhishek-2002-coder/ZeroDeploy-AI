'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogsViewerProps {
  logs: string[];
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}

export const LogsViewer: React.FC<LogsViewerProps> = ({ logs, isOpen, onClose, projectName }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl h-[70vh] glass rounded-3xl flex flex-col overflow-hidden border border-white/10 shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Build Logs — {projectName}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div
              ref={scrollRef}
              className="flex-1 p-6 overflow-y-auto font-mono text-sm space-y-2 bg-black/40"
            >
              {logs.length === 0 ? (
                <div className="text-muted-foreground italic h-full flex items-center justify-center">
                  Waiting for logs...
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-white/20 select-none w-8 text-right">{i + 1}</span>
                    <span className="text-white/80 whitespace-pre-wrap">{log}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
