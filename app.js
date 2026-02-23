// 1. Move imports that might crash (like 'next') inside the try block if possible, 
// or at least log before them.
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');

const logFile = path.join(__dirname, 'server_log.txt');

function log(message) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
  } catch (e) {
    // If we can't write to file, try console but don't crash
    console.error('LOGGING FAILED:', e.message);
  }
}

// 2. Log IMMEDIATE start
log('*** SERVER STARTUP ATTEMPT (Real App) ***');
log(`Node Version: ${process.version}`);

let next;
try {
  log('Attempting to require("next")...');
  next = require('next');
  log('require("next") successful.');
} catch (e) {
  log(`CRITICAL ERROR: Failed to require "next". Is it installed? Details: ${e.message}\n${e.stack}`);
  process.exit(1);
}

const dev = false; // Force production mode to avoid Turbopack/HMR errors in Plesk
const hostname = 'localhost';
const port = process.env.PORT || 3000;

try {
  log(`Initializing Next.js app instance (dev=${dev})...`);
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  log('Running app.prepare()...');
  app.prepare().then(() => {
    log('app.prepare() finished. Creating HTTP server...');

    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        const { pathname, query } = parsedUrl;

        if (pathname === '/a') {
          await app.render(req, res, '/a', query);
        } else if (pathname === '/b') {
          await app.render(req, res, '/b', query);
        } else {
          await handle(req, res, parsedUrl);
        }
      } catch (err) {
        log(`REQUEST ERROR: ${err.message}`);
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    })
      .once('error', (err) => {
        log(`SERVER ERROR: ${err.message}`);
        console.error(err);
        process.exit(1);
      })
      .listen(port, () => {
        log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Ready on http://${hostname}:${port}`);
      });
  }).catch(err => {
    log(`PREPARE ERROR: ${err.message}\n${err.stack}`);
  });

} catch (err) {
  log(`TOP LEVEL ERROR: ${err.message}\n${err.stack}`);
}
