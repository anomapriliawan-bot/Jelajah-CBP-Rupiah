import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & URL-encoded parser with generous payload limit for base64 uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const publicDir = path.join(process.cwd(), 'public');
  const uploadsDir = path.join(publicDir, 'images', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Explicitly serve /images statically with proper MIME types
  app.use('/images', express.static(path.join(publicDir, 'images')));

  // Health check API
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Physical file upload endpoint (persists images directly into public/images/ on the workspace disk)
  app.post('/api/upload', async (req: Request, res: Response) => {
    try {
      const { fileName, dataUrl, category } = req.body;

      if (!fileName || !dataUrl) {
        return res.status(400).json({ error: 'fileName and dataUrl are required' });
      }

      // Safe clean filename
      const originalExt = path.extname(fileName) || '.png';
      const cleanBaseName = path
        .basename(fileName, originalExt)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toLowerCase()
        .slice(0, 80);

      // Determine subfolder: e.g. final-mission, lessons, uploads
      const cleanCategory = (category || 'uploads').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
      const targetDir = path.join(publicDir, 'images', cleanCategory);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const finalFileName = `${cleanBaseName}${originalExt.toLowerCase()}`;
      const targetFilePath = path.join(targetDir, finalFileName);

      // Extract raw base64 data
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      if (matches && matches.length === 3) {
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(dataUrl, 'base64');
      }

      // Write physical file to server disk
      await fs.promises.writeFile(targetFilePath, buffer);

      const publicUrl = `/images/${cleanCategory}/${finalFileName}`;
      console.log(`[Upload Server] Saved file: ${finalFileName} (${buffer.length} bytes) -> ${publicUrl}`);

      return res.json({
        success: true,
        url: publicUrl,
        fileName: finalFileName,
        size: buffer.length,
      });
    } catch (err: any) {
      console.error('[Upload Error]', err);
      return res.status(500).json({ error: err.message || 'Failed to save physical file' });
    }
  });

  // Delete uploaded file endpoint
  app.delete('/api/upload', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'url parameter is required' });
      }

      // Prevent directory traversal
      const normalized = path.normalize(url).replace(/^(\.\.[\/\\])+/, '');
      if (!normalized.startsWith('/images/') && !normalized.startsWith('images/')) {
        return res.status(400).json({ error: 'Forbidden file path' });
      }

      const relativePart = normalized.replace(/^\/?images\//, '');
      const fullPath = path.join(publicDir, 'images', relativePart);

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        console.log(`[Upload Server] Deleted physical file: ${fullPath}`);
      }

      return res.json({ success: true, message: 'File removed successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to delete file' });
    }
  });

  // Permanently save custom default mission & curriculum master
  app.post('/api/set-system-default', async (req: Request, res: Response) => {
    try {
      const data = req.body;
      if (!data || !data.missions || !Array.isArray(data.missions)) {
        return res.status(400).json({ error: 'Data payload tidak valid (wajib menyertakan array missions)' });
      }

      const targetPath = path.join(process.cwd(), 'src', 'data', 'customDefaultMaster.json');
      await fs.promises.writeFile(targetPath, JSON.stringify(data, null, 2), 'utf-8');

      console.log(`[System Default] Sukses menyimpan ${data.missions.length} misi sebagai default permanen sistem.`);
      return res.json({
        success: true,
        missionsCount: data.missions.length,
        lessonsCount: data.lessons?.length || 0,
        questionsCount: data.practiceQuestions?.length || 0,
      });
    } catch (err: any) {
      console.error('[System Default Error]', err);
      return res.status(500).json({ error: err.message || 'Gagal menyimpan default sistem ke file server' });
    }
  });

  // Get current system default
  app.get('/api/system-default', async (_req: Request, res: Response) => {
    try {
      const targetPath = path.join(process.cwd(), 'src', 'data', 'customDefaultMaster.json');
      if (fs.existsSync(targetPath)) {
        const content = await fs.promises.readFile(targetPath, 'utf-8');
        return res.json(JSON.parse(content));
      }
      return res.json(null);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use(express.static(publicDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
