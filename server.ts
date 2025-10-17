import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get(
    '*.*',
    express.static(browserDistFolder, {
      maxAge: '1y',
    })
  );

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    const data = {
      url: 'https://www.anapioficeandfire.com/api/characters/561',
      name: 'Jeyne Westerling',
      gender: 'Female',
      culture: 'Westerman',
      born: 'In 283 AC, at the Crag',
      titles: ['Queen', 'Lady of Winterfell'],
      books: [
        'https://www.anapioficeandfire.com/api/books/3',
        'https://www.anapioficeandfire.com/api/books/5',
      ],
      spouse: 'https://www.anapioficeandfire.com/api/characters/1880',
    };

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => {
        const injectedHtml = html.replace(
          '</head>',
          `
          <title>${data.name}</title>
          <meta name="description" content="${data.titles.join(', ')}">
          <meta property="og:title" content="${data.name}">
          <meta property="og:description" content="${data.titles.join(', ')}">
          <meta property="og:image" content="https://picsum.photos/200/300">
          <meta property="og:url" content="https://picsum.photos/200/300">
          <meta name="twitter:card" content="summary_large_image">
          </head>`
        );

        res.send(injectedHtml);
      })
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

//run();
