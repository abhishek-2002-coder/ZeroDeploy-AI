import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ProjectConfig } from './analyzer.js';

export class LocalRunnerService {
  private static processes: Record<string, any[]> = {};

  static async deploy(projectPath: string, config: ProjectConfig, deploymentId: string, socket: any): Promise<string> {
    socket.emit('deployment:status', { id: deploymentId, status: 'Installing Dependencies' });
    this.processes[deploymentId] = [];

    try {
      if (config.installCommand) {
        await this.runCommand(config.installCommand, projectPath, deploymentId, socket);
      }

      if (config.buildCommand) {
        socket.emit('deployment:status', { id: deploymentId, status: 'Building Project' });
        await this.runCommand(config.buildCommand, projectPath, deploymentId, socket);
      }

      socket.emit('deployment:status', { id: deploymentId, status: 'Starting Server' });
      
      const mainPort = Math.floor(Math.random() * (40000 - 10000) + 10000);
      const hostname = socket.handshake?.headers?.host?.split(':')[0] || 'localhost';

      let result: { url: string; frontendUrl?: string; backendUrl?: string; ports: number[] };

      if (config.type === 'fullstack') {
        result = await this.startFullstack(projectPath, config, deploymentId, socket, mainPort, hostname);
      } else {
        const url = await this.startSingle(projectPath, config, deploymentId, socket, mainPort, hostname);
        result = { url, ports: [mainPort] };
      }

      // Generate Public HTTPS Tunnels (Genuine, no splash screen)
      socket.emit('deployment:logs', { id: deploymentId, log: '🌐 Tunneling public endpoints via SSH (no-splash)...\n' });

      const tunnels: Record<string, string> = {};
      
      // Main Entry Point
      const mainTunnel = await this.createTunnel(mainPort);
      if (mainTunnel) {
        tunnels.url = mainTunnel;
        socket.emit('deployment:logs', { id: deploymentId, log: `✨ Unified URL: ${mainTunnel}\n` });
      }

      if (config.type === 'fullstack') {
        const bPort = result.ports[1];
        const fPort = result.ports[2];
        
        const fTunnel = await this.createTunnel(fPort);
        if (fTunnel) {
          tunnels.frontendUrl = fTunnel;
          socket.emit('deployment:logs', { id: deploymentId, log: `🎨 Frontend URL: ${fTunnel}\n` });
        }

        const bTunnel = await this.createTunnel(bPort);
        if (bTunnel) {
          tunnels.backendUrl = bTunnel;
          socket.emit('deployment:logs', { id: deploymentId, log: `🔌 Backend URL: ${bTunnel}\n` });
        }
      }

      socket.emit('deployment:status', { 
        id: deploymentId, 
        status: 'Live', 
        url: tunnels.url || result.url,
        localUrl: result.url,
        frontendUrl: tunnels.frontendUrl || result.frontendUrl,
        backendUrl: tunnels.backendUrl || result.backendUrl,
        framework: config.type === 'fullstack' ? `Fullstack (${config.framework})` : config.framework
      });

      return tunnels.url || result.url;

    } catch (error: any) {
      console.error('Local deployment failed:', error);
      socket.emit('deployment:status', { id: deploymentId, status: 'Failed', error: error.message });
      throw error;
    }
  }

  private static createTunnel(port: number): Promise<string> {
    return new Promise((resolve) => {
      // Using localhost.run via SSH - Genuine URL, No Splash Screen
      const ssh = spawn('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'ServerAliveInterval=30',
        '-R', `80:127.0.0.1:${port}`,
        'nokey@localhost.run'
      ], { shell: true });

      let urlFound = false;
      ssh.stdout.on('data', (data) => {
        const line = data.toString();
        // localhost.run output format: "tunneled with https://...lhr.life"
        const match = line.match(/https:\/\/[^\s]+\.lhr\.life/);
        if (match && !urlFound) {
          urlFound = true;
          resolve(match[0]);
        }
      });

      ssh.stderr.on('data', (data) => {
        console.log('Tunnel Error:', data.toString());
      });

      // Cleanup on exit
      process.on('exit', () => ssh.kill());

      // Timeout if it takes too long
      setTimeout(() => {
        if (!urlFound) {
          ssh.kill();
          resolve('');
        }
      }, 15000);
    });
  }

  private static async startSingle(projectPath: string, config: ProjectConfig, id: string, socket: any, port: number, hostname: string): Promise<string> {
      let startCmd = config.startCommand;
      if (startCmd.includes('uvicorn')) {
        const module = startCmd.split(' ')[1];
        startCmd = `python -m uvicorn ${module} --host 0.0.0.0 --port ${port}`;
      } else if (startCmd.includes('--port')) {
        startCmd = startCmd.replace(/--port\s+\d+/, `--port ${port}`);
      } else if (config.framework === 'Next.js' || config.framework === 'Node.js') {
        if (startCmd !== 'npm start' && startCmd !== 'npm run dev') {
          startCmd += ` --port ${port}`;
        }
      } else if (config.framework === 'Static HTML') {
        startCmd = startCmd.replace(/\s-l\s\d+/, ` -l ${port}`);
        if (!startCmd.includes('-l')) startCmd += ` -l ${port}`;
      }

      const [cmd, ...args] = startCmd.split(' ');
      const child = spawn(cmd, args, { cwd: projectPath, env: { ...process.env, PORT: port.toString() }, shell: true });
      this.processes[id] = this.processes[id] || [];
      this.processes[id].push(child);
      this.pipeLogs(child, id, socket);
      
      await this.waitForPort(port, child);
      return `http://${hostname}:${port}`;
  }

  private static async startFullstack(projectPath: string, config: ProjectConfig, id: string, socket: any, mainPort: number, hostname: string): Promise<{ url: string; frontendUrl: string; backendUrl: string; ports: number[] }> {
    const backendPort = mainPort + 1;
    const frontendPort = mainPort + 2;

    let backendCmd = config.startCommand;
    if (backendCmd.includes('uvicorn')) {
      const module = backendCmd.split(' ')[1];
      backendCmd = `python -m uvicorn ${module} --host 0.0.0.0 --port ${backendPort}`;
    } else {
      backendCmd += ` --port ${backendPort}`;
    }

    const bChild = spawn(backendCmd.split(' ')[0], backendCmd.split(' ').slice(1), { cwd: projectPath, env: { ...process.env, PORT: backendPort.toString() }, shell: true });
    this.processes[id].push(bChild);
    this.pipeLogs(bChild, id, socket);

    const fChild = spawn('npx', ['serve', '-s', '.', '-l', frontendPort.toString()], { cwd: projectPath, shell: true });
    this.processes[id].push(fChild);
    this.pipeLogs(fChild, id, socket);

    const proxyScript = `
import express from 'express';
import proxy from 'express-http-proxy';
const app = express();
app.use('/api', proxy('http://localhost:${backendPort}'));
app.use('/chat', proxy('http://localhost:${backendPort}/chat'));
app.use('/', proxy('http://localhost:${frontendPort}'));
app.listen(${mainPort}, '0.0.0.0');
    `;
    fs.writeFileSync(path.join(projectPath, 'zerodeploy-proxy.js'), proxyScript);
    
    const pChild = spawn('node', ['zerodeploy-proxy.js'], { cwd: projectPath, shell: true });
    this.processes[id].push(pChild);
    this.pipeLogs(pChild, id, socket);

    await this.waitForPort(mainPort, pChild);
    
    return {
        url: `http://${hostname}:${mainPort}`,
        frontendUrl: `http://${hostname}:${frontendPort}`,
        backendUrl: `http://${hostname}:${backendPort}`,
        ports: [mainPort, backendPort, frontendPort]
    };
  }

  private static pipeLogs(child: any, id: string, socket: any) {
    child.stdout.on('data', (d: any) => socket.emit('deployment:logs', { id, log: d.toString() }));
    child.stderr.on('data', (d: any) => socket.emit('deployment:logs', { id, log: d.toString() }));
  }

  private static async waitForPort(port: number, child: any): Promise<void> {
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          const client = new (await import('net')).Socket();
          await new Promise((res, rej) => {
            client.once('connect', () => { client.destroy(); res(true); });
            client.once('error', rej);
            client.connect(port, 'localhost');
          });
          return;
        } catch (e) {
          if (child.exitCode !== null) throw new Error("Process exited prematurely");
        }
    }
    throw new Error(`Port ${port} timeout`);
  }

  private static runCommand(command: string, cwd: string, id: string, socket: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, { cwd, shell: true });
      this.pipeLogs(child, id, socket);
      child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Command ${command} failed`)));
    });
  }
}
