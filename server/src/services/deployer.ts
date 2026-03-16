import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AnalyzerService, ProjectConfig } from './analyzer.js';
import { AIStudio } from './ai-fixer.js';
import { LocalRunnerService } from './local-runner.js';

const docker = new Docker();

export class DeployerService {
  static async isDockerAvailable(): Promise<boolean> {
    try {
      await docker.ping();
      return true;
    } catch (e) {
      return false;
    }
  }

  static async deploy(projectPath: string, socket: any): Promise<string> {
    const deploymentId = uuidv4();
    console.log(`Starting deployment ${deploymentId} for path: ${projectPath}`);
    const config = await AnalyzerService.analyzeProject(projectPath);

    socket.emit('deployment:status', { id: deploymentId, status: 'Analyzing', config });

    const dockerAvailable = await this.isDockerAvailable();

    if (!dockerAvailable) {
      console.log('Docker not detected, falling back to Local Runner...');
      socket.emit('deployment:logs', { id: deploymentId, log: '⚠️ Docker not detected. Falling back to Local Runner mode...\n' });
      return LocalRunnerService.deploy(projectPath, config, deploymentId, socket);
    }

    // Docker logic follows...
    const dockerfile = this.generateDockerfile(config);
    fs.writeFileSync(path.join(projectPath, 'Dockerfile'), dockerfile);

    socket.emit('deployment:status', { id: deploymentId, status: 'Building Image' });

    try {
      const imageName = `zerodeploy-${deploymentId}`;
      
      // Build image
      const stream = await docker.buildImage({
        context: projectPath,
        src: fs.readdirSync(projectPath)
      }, { t: imageName });

      await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        }, (event) => {
          if (event.stream) {
            socket.emit('deployment:logs', { id: deploymentId, log: event.stream });
          }
        });
      });

      socket.emit('deployment:status', { id: deploymentId, status: 'Starting Container' });

      // Run container
      const container = await docker.createContainer({
        Image: imageName,
        name: `container-${deploymentId}`,
        ExposedPorts: { '3000/tcp': {} },
        HostConfig: {
          PortBindings: { '3000/tcp': [{ HostPort: '0' }] } // Random host port
        }
      });

      await container.start();
      
      const containerInfo = await container.inspect();
      const port = containerInfo.NetworkSettings.Ports['3000/tcp'][0].HostPort;

      const url = `http://localhost:${port}`;
      socket.emit('deployment:status', { id: deploymentId, status: 'Live', url });

      return url;
    } catch (error: any) {
      console.error('Deployment failed:', error);
      const aiSuggestion = AIStudio.suggestFix(error.message);
      socket.emit('deployment:status', { 
        id: deploymentId, 
        status: 'Failed', 
        error: error.message,
        aiSuggestion 
      });
      throw error;
    }
  }

  private static generateDockerfile(config: ProjectConfig): string {
    if (config.language === 'JavaScript/TypeScript') {
      return `
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN ${config.installCommand}
COPY . .
${config.buildCommand ? `RUN ${config.buildCommand}` : ''}
EXPOSE 3000
CMD ["npm", "start"]
      `.trim();
    }

    if (config.language === 'Python') {
      return `
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD [${config.startCommand.split(' ').map(s => `"${s}"`).join(', ')}]
      `.trim();
    }

    return `
FROM node:18-alpine
RUN npm install -g serve
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["serve", "-s", ".", "-l", "3000"]
    `.trim();
  }
}
