import fs from 'fs';
import path from 'path';

export interface ProjectConfig {
  framework: string;
  language: string;
  buildCommand: string;
  startCommand: string;
  installCommand: string;
  outputDir?: string;
  type: 'frontend' | 'backend' | 'fullstack';
}

export class AnalyzerService {
  static async analyzeProject(projectPath: string): Promise<ProjectConfig> {
    const files = fs.readdirSync(projectPath);

    // Node.js based projects
    if (files.includes('package.json')) {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8')
      );
      const dependencies = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {}),
      };

      const isFullstack = files.includes('index.html');

      if (dependencies['next']) {
        return {
          framework: 'Next.js',
          language: 'JavaScript/TypeScript',
          installCommand: 'npm install',
          buildCommand: 'npm run build',
          startCommand: 'npm start',
          outputDir: '.next',
          type: isFullstack ? 'fullstack' : 'frontend',
        };
      }

      if (dependencies['react']) {
        return {
          framework: 'React',
          language: 'JavaScript/TypeScript',
          installCommand: 'npm install',
          buildCommand: 'npm run build',
          startCommand: 'npx serve -s build',
          outputDir: 'build',
          type: isFullstack ? 'fullstack' : 'frontend',
        };
      }

      return {
        framework: 'Node.js',
        language: 'JavaScript/TypeScript',
        installCommand: 'npm install',
        buildCommand: '',
        startCommand: 'npm start',
        type: isFullstack ? 'fullstack' : 'backend',
      };
    }

    // Python projects
    if (files.includes('requirements.txt')) {
      const requirements = fs.readFileSync(path.join(projectPath, 'requirements.txt'), 'utf-8');
      
      // Better entry point detection: Scan for FastAPI or Flask app instances
      let pythonEntryFile: string | undefined = files.find(f => f === 'main.py' || f === 'app.py');
      
      if (!pythonEntryFile) {
        // Look inside all .py files for "app ="
        for (const file of files.filter(f => f.endsWith('.py'))) {
          const content = fs.readFileSync(path.join(projectPath, file), 'utf-8');
          if (content.includes('app = FastAPI') || content.includes('app = Flask')) {
            pythonEntryFile = file;
            break;
          }
        }
      }

      const isFullstack = files.includes('index.html');
      const moduleName = pythonEntryFile ? pythonEntryFile.replace('.py', '') : 'main';

      if (requirements.includes('fastapi')) {
        return {
          framework: 'FastAPI',
          language: 'Python',
          installCommand: 'python -m pip install -r requirements.txt uvicorn',
          buildCommand: '',
          startCommand: `uvicorn ${moduleName}:app --host 0.0.0.0 --port 8000`,
          type: isFullstack ? 'fullstack' : 'backend',
        };
      }

      if (requirements.includes('flask')) {
        return {
          framework: 'Flask',
          language: 'Python',
          installCommand: 'pip install -r requirements.txt',
          buildCommand: '',
          startCommand: `python ${moduleName}.py`,
          type: isFullstack ? 'fullstack' : 'backend',
        };
      }

      return {
        framework: 'Python',
        language: 'Python',
        installCommand: 'pip install -r requirements.txt',
        buildCommand: '',
        startCommand: `python ${moduleName}.py`,
        type: isFullstack ? 'fullstack' : 'backend',
      };
    }

    // Default or unknown
    return {
      framework: 'Static HTML',
      language: 'HTML',
      installCommand: '',
      buildCommand: '',
      startCommand: 'npx serve .',
      type: 'frontend',
    };
  }
}
