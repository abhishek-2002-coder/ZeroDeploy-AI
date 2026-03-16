import { simpleGit, SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const git: SimpleGit = simpleGit();

export class GithubService {
  static async cloneRepo(repoUrl: string, branch: string = 'main'): Promise<{ projectId: string; path: string }> {
    const projectId = uuidv4();
    const targetPath = path.join(process.cwd(), 'deployments', projectId);

    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    try {
      console.log(`Cloning ${repoUrl} into ${targetPath}...`);
      await git.clone(repoUrl, targetPath, ['--branch', branch, '--single-branch']);
      return { projectId, path: targetPath };
    } catch (error) {
      console.error('Git clone failed:', error);
      throw new Error(`Failed to clone repository: ${error}`);
    }
  }

  static async pullUpdates(projectPath: string): Promise<void> {
    const gitInstance = simpleGit(projectPath);
    try {
      console.log(`Pulling updates for ${projectPath}...`);
      await gitInstance.pull();
    } catch (error) {
      console.error('Git pull failed:', error);
      throw new Error(`Failed to pull updates: ${error}`);
    }
  }
}
