'use client';

import React from 'react';
import { ExternalLink, CheckCircle, Clock, AlertCircle, Terminal, Package } from 'lucide-react';
import { motion } from 'framer-motion';

export interface Deployment {
  id: string;
  name: string;
  status: 'Analyzing' | 'Building Image' | 'Starting Container' | 'Live' | 'Failed';
  framework?: string;
  url?: string;
  localUrl?: string;
  frontendUrl?: string;
  backendUrl?: string;
  error?: string;
  aiSuggestion?: string;
}

interface ProjectCardProps {
  deployment: Deployment;
  onViewLogs: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ deployment, onViewLogs }) => {
  const getStatusIcon = () => {
    switch (deployment.status) {
      case 'Live':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'Failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 glass rounded-2xl glow group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{deployment.name}</h3>
            <p className="text-sm text-muted-foreground">{deployment.framework || 'Detecting...'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-xs font-medium border border-white/5">
          {getStatusIcon()}
          {deployment.status}
        </div>
      </div>

      <div className="space-y-4">
        {deployment.url && (
          <div className="space-y-2">
            <a
              href={deployment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm group"
            >
              <div className="flex flex-col truncate">
                <span className="text-[10px] uppercase font-bold text-emerald-500/60 mb-1">Public URL (HTTPS)</span>
                <span className="truncate">{deployment.url}</span>
              </div>
              <ExternalLink className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>

            {deployment.localUrl && (
              <a
                href={deployment.localUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 transition-all text-xs group"
              >
                <div className="flex flex-col truncate">
                  <span className="text-[9px] uppercase font-medium text-muted-foreground mb-1">Local Network URL</span>
                  <span className="truncate">{deployment.localUrl}</span>
                </div>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}

            {(deployment.frontendUrl || deployment.backendUrl) && (
              <div className="grid grid-cols-2 gap-2">
                {deployment.frontendUrl && (
                  <a
                    href={deployment.frontendUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[11px]"
                  >
                    <span className="text-[9px] uppercase font-medium text-muted-foreground mb-1">Frontend</span>
                    <span className="truncate">{deployment.frontendUrl}</span>
                  </a>
                )}
                {deployment.backendUrl && (
                  <a
                    href={deployment.backendUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[11px]"
                  >
                    <span className="text-[9px] uppercase font-medium text-muted-foreground mb-1">Backend</span>
                    <span className="truncate">{deployment.backendUrl}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {deployment.error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <div className="font-bold mb-1">Error: {deployment.error}</div>
            {deployment.aiSuggestion && (
              <div className="mt-2 p-2 bg-primary/10 rounded border border-primary/20 text-primary-foreground italic">
                <span className="font-bold">AI Helper:</span> {deployment.aiSuggestion}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => onViewLogs(deployment.id)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-medium"
        >
          <Terminal className="w-4 h-4" /> View Build Logs
        </button>
      </div>
    </motion.div>
  );
};
