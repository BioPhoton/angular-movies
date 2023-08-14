import 'zone.js/dist/zone-node';
import express from 'express';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {ngExpressEngine} from '@nguniversal/express-engine';
import bootstrap from './app/bootstrap';
import {useCompression} from './shared/compression/use-compression';
import {useTiming} from './shared/server-timing/use-server-timing';
import {APP_BASE_HREF} from '@angular/common';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();


  const distributionFolder = join(
    process.cwd(),
    'dist/projects/movies/browser'
  );
  const indexHtml = existsSync(join(distributionFolder, 'index.html'))
    ? 'index.html'
    : 'index';

  // use gzip
  useCompression(server);
  // use server-timing
  useTiming(server);

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
  server.engine('html', ngExpressEngine({bootstrap}));

  server.set('view engine', 'html');
  server.set('views', distributionFolder);

  // Serve static files from /browser
  server.get(
    '*.*',
    express.static(distributionFolder, {
      maxAge: '1y',
      // missing assets results in 404 instead of continuing to next route handler (and rendering route)
      fallthrough: false,
    })
  );

  server.get('*', (request, response, _) => {
    // return rendered HTML including Angular generated DOM
    console.log('SSR for route:', request.url);
    response.startTime('SSR', 'Total SSR Time');
    response.render(
      indexHtml,
      {
        req: request,
        res: response,
        providers: [{provide: APP_BASE_HREF, useValue: "/us-central1/angular-movies-a12d3/us-central1/ssr/"}],
      },
      (_, html) => {
        response.endTime('SSR');
        response.send(
          html + `<!-- ngUniversal SSR ${new Date().toISOString()} -->`
        );
      }
    );
  });

  return server;
}

export {default} from './app/bootstrap';
