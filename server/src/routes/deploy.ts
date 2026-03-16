import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import unzipper from 'unzipper';
import { v4 as uuidv4 } from 'uuid';
import { DeployerService } from '../services/deployer.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('project'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const projectId = uuidv4();
  const extractPath = path.join(process.cwd(), 'deployments', projectId);

  if (!fs.existsSync(extractPath)) {
    fs.mkdirSync(extractPath, { recursive: true });
  }

  fs.createReadStream(file.path)
    .pipe(unzipper.Extract({ path: extractPath }))
    .on('close', () => {
      // Clean up the uploaded zip
      fs.unlinkSync(file.path);

      res.json({ message: 'Project uploaded and extracted', projectId });
    })
    .on('error', (err) => {
      res.status(500).json({ error: 'Failed to extract project', details: err.message });
    });
});

export default router;
