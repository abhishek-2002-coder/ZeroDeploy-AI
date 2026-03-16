import { Router } from 'express';
import axios from 'axios';
import { GithubService } from '../services/github.js';
import { DeployerService } from '../services/deployer.js';
import path from 'path';

const router = Router();

// This would be called by GitHub after OAuth login
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided');

  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }, {
      headers: { Accept: 'application/json' }
    });

    const accessToken = response.data.access_token;
    res.json({ accessToken });
  } catch (error) {
    res.status(500).send('OAuth failed');
  }
});

// Webhook listener for auto-deploy
router.post('/webhook', async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  if (event === 'push') {
    const repoUrl = payload.repository.clone_url;
    const branch = payload.ref.replace('refs/heads/', '');
    
    console.log(`Received push event for ${repoUrl} on branch ${branch}`);

    // In a real app, we would look up which project this repo belongs to
    // For this MVP, we assume a mapping or just clone fresh for demo
    try {
      // Logic to trigger re-deployment
      // 1. Identify existing project path if any OR clone fresh
      // 2. Run DeployerService.deploy
      res.status(200).send('Webhook received, deployment triggered');
    } catch (error) {
      res.status(500).send('Deployment failed');
    }
  } else {
    res.status(200).send('Event ignored');
  }
});

// Direct deploy from repo URL
router.post('/deploy-repo', async (req, res) => {
  const { repoUrl, branch } = req.body;
  
  try {
    const { projectId, path: projectPath } = await GithubService.cloneRepo(repoUrl, branch);
    res.json({ message: 'Repository cloned, starting deployment', projectId });
    
    // The client should now connect to socket and emit 'deploy:start' with this projectId
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
