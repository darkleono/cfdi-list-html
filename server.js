const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1'; // O 'localhost'
const port = 8080; // Puedes usar otro puerto si lo deseas

const server = http.createServer((req, res) => {
  // Obtiene la ruta del archivo solicitado
  const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url); 

  // Obtiene la extensión del archivo
  const extname = path.extname(filePath);

  // Define el tipo de contenido según la extensión
  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.xml':
      contentType = 'text/xml';
      break;
  }

  // Lee y sirve el archivo
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        // Archivo no encontrado
        res.writeHead(404);
        res.end('Archivo no encontrado');
      } else {
        // Otro error
        res.writeHead(500);
        res.end(`Error del servidor: ${error.code}`);
      }
    } else {
      // Sirve el archivo
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, hostname, () => {
  console.log(`Servidor iniciado en http://${hostname}:${port}/`);
});