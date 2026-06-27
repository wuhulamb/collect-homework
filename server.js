const http = require('http');
const fs = require('fs');
const path = require('path');
const Busboy = require('@fastify/busboy');

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const PORT = 3000;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
};

function serveStatic(url, res) {
  const publicDir = path.join(__dirname, 'public');
  const relativePath = url === '/' ? 'index.html' : url.replace(/^\//, '');
  let filePath = path.resolve(publicDir, relativePath);
  if (!filePath.startsWith(publicDir + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    serveStatic(req.url, res);
    return;
  }

  if (req.method === 'POST' && req.url === '/upload') {
    const busboy = new Busboy({ headers: req.headers });
    let fileReceived = false;

    busboy.on('file', (fieldname, file, filename) => {
      fileReceived = true;
      const safeName = path.basename(filename);
      const targetPath = path.join(UPLOAD_DIR, safeName);
      const writeStream = fs.createWriteStream(targetPath);
      file.pipe(writeStream);

      writeStream.on('finish', () => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ filename: safeName }));
      });

      writeStream.on('error', () => {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: '文件保存失败' }));
      });
    });

    busboy.on('finish', () => {
      if (!fileReceived) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: '未接收到文件' }));
      }
    });

    req.pipe(busboy);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log(`服务器已启动: http://localhost:${PORT}`);
  console.log(`上传目录: ${UPLOAD_DIR}`);
});
