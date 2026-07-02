import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3001;

const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, safeName);
  }
});

const upload = multer({ storage });
app.use(express.json());

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const allowed = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf'];
  if (!allowed.includes(ext)) {
    return res.status(400).json({ message: 'Only Word, Excel, PowerPoint, and PDF files are supported.' });
  }

  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, fileName: req.file.originalname, url });
});

app.use('/uploads', express.static(uploadDir));

app.listen(port, () => {
  console.log(`Office preview server listening on http://localhost:${port}`);
});
