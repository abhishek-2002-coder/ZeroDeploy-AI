'use client';

import React, { useState, useEffect } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { GithubDeploy } from '@/components/GithubDeploy';
import { ProjectCard, Deployment } from '@/components/ProjectCard';
import { LogsViewer } from '@/components/LogsViewer';
import { api, uploadProject } from '@/lib/api';
import { socket } from '@/lib/socket';
import { Rocket, Github, LayoutGrid, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeLogsId, setActiveLogsId] = useState<string | null>(null);
  const [allLogs, setAllLogs] = useState<Record<string, string[]>>({});
  const [deployMode, setDeployMode] = useState<'zip' | 'github'>('zip');

  useEffect(() => {
    socket.connect();

    socket.on('deployment:status', (data: any) => {
      setDeployments((prev) => {
        const index = prev.findIndex((d) => d.id === data.id);
        if (index === -1) {
          return [
            ...prev,
            {
              id: data.id,
              name: `Project ${data.id.slice(0, 4)}`,
              status: data.status,
              framework: data.config?.framework,
              url: data.url,
              error: data.error,
              aiSuggestion: data.aiSuggestion,
            },
          ];
        }
        const updated = [...prev];
        updated[index] = { ...updated[index], ...data };
        return updated;
      });
    });

    socket.on('deployment:logs', (data: any) => {
      setAllLogs((prev) => ({
        ...prev,
        [data.id]: [...(prev[data.id] || []), data.log],
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const { projectId } = await uploadProject(file);
      socket.emit('deploy:start', { projectId });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please check the console.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRepoDeploy = async (repoUrl: string, branch: string) => {
    setIsUploading(true);
    console.log('Starting GitHub deployment for:', repoUrl);
    try {
      const response = await api.post('/github/deploy-repo', { repoUrl, branch });
      const { projectId } = response.data;
      
      if (projectId) {
        console.log('Repo cloned successfully, projectId:', projectId);
        socket.emit('deploy:start', { projectId });
      } else {
        throw new Error('No projectId returned from server');
      }
    } catch (error: any) {
      console.error('GitHub deploy error details:', error);
      const message = error.response?.data?.error || error.message || 'Unknown error';
      alert(`GitHub deployment failed: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const activeDeployment = deployments.find((d) => d.id === activeLogsId);

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed top-0 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 -right-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-screen w-20 flex flex-col items-center py-8 border-r border-white/5 glass z-40">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-12 shadow-lg shadow-primary/20">
          <Rocket className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 space-y-8">
          <button className="p-3 text-primary bg-primary/10 rounded-xl">
            <LayoutGrid className="w-6 h-6" />
          </button>
          <button className="p-3 text-muted-foreground hover:text-foreground transition-colors">
            <Github className="w-6 h-6" />
          </button>
          <button className="p-3 text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-6 h-6" />
          </button>
        </div>
        <button className="p-3 text-muted-foreground hover:text-red-400 transition-colors">
          <LogOut className="w-6 h-6" />
        </button>
      </nav>

      {/* Main Content */}
      <div className="pl-20">
        {/* Header */}
        <header className="p-8 flex justify-between items-center border-b border-white/5 backdrop-blur-md sticky top-0 z-30">
          <div>
            <h1 className="text-3xl font-bold gradient-text">ZeroDeploy AI</h1>
            <p className="text-muted-foreground">Unlimited deployments with AI automation.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-full glass border border-white/10 text-sm font-medium">
              Free Tier
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 border-2 border-white/20" />
          </div>
        </header>

        <section className="p-8 max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold">Create New Deployment</h2>
              <div className="flex p-1 bg-white/5 rounded-lg border border-white/5 self-start">
                <button
                  onClick={() => setDeployMode('zip')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    deployMode === 'zip' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ZIP Upload
                </button>
                <button
                  onClick={() => setDeployMode('github')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    deployMode === 'github' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  GitHub Repo
                </button>
              </div>
            </div>

            {deployMode === 'zip' ? (
              <UploadZone onUpload={handleUpload} isUploading={isUploading} />
            ) : (
              <GithubDeploy onDeploy={handleRepoDeploy} isLoading={isUploading} />
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Your Projects</h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">
                  {deployments.filter((d) => d.status === 'Live').length} Live
                </span>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                  {deployments.filter((d) => ['Analyzing', 'Building Image', 'Starting Container'].includes(d.status)).length} Building
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {deployments.map((deployment) => (
                  <ProjectCard
                    key={deployment.id}
                    deployment={deployment}
                    onViewLogs={setActiveLogsId}
                  />
                ))}
              </AnimatePresence>
            </div>

            {deployments.length === 0 && !isUploading && (
              <div className="text-center py-24 glass rounded-3xl border border-white/5">
                <p className="text-muted-foreground text-lg mb-4">No projects deployed yet.</p>
                <p className="text-sm text-muted-foreground/60">Upload a project to see it here.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <LogsViewer
        isOpen={!!activeLogsId}
        onClose={() => setActiveLogsId(null)}
        projectName={activeDeployment?.name || ''}
        logs={activeLogsId ? (allLogs[activeLogsId] || []) : []}
      />
    </main>
  );
}
