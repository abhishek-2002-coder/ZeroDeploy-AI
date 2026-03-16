'use client';

import React, { useState } from 'react';
import { Github, Rocket, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface GithubDeployProps {
  onDeploy: (repoUrl: string, branch: string) => void;
  isLoading: boolean;
}

export const GithubDeploy: React.FC<GithubDeployProps> = ({ onDeploy, isLoading }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl) {
      onDeploy(repoUrl, branch);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 glass rounded-2xl glow border border-white/10 max-w-2xl mx-auto mt-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
          <Github className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Import from GitHub</h2>
          <p className="text-sm text-muted-foreground">Deploy any public repository in seconds.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 ml-1">Repository URL</label>
          <input
            type="text"
            placeholder="https://github.com/username/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            required
          />
        </div>
        <div className="w-1/3">
          <label className="block text-sm font-medium mb-1.5 ml-1">Branch</label>
          <input
            type="text"
            placeholder="main"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !repoUrl}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Rocket className="w-5 h-5" /> Deploy Repository
            </>
          )}
        </button>
      </form>
      
      <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
        <p className="text-xs text-primary/80 leading-relaxed">
          <span className="font-bold">Tip:</span> To enable auto-deploy, add your server's webhook URL to your GitHub repository settings under <strong>Webhooks</strong>.
        </p>
        <code className="block mt-2 text-[10px] bg-black/40 p-2 rounded border border-white/5 overflow-x-auto">
          http://your-server-ip/api/github/webhook
        </code>
      </div>
    </motion.div>
  );
};
