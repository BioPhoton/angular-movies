import { ApplicationConfig, Injectable, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { RX_RENDER_STRATEGIES_CONFIG } from '@rx-angular/cdk/render-strategies';
import { provideFastSVG, SvgLoadStrategy } from '@push-based/ngx-fast-svg';
import { join, resolve } from 'node:path';
import { cwd } from 'node:process';

import appConfig from './app.config';

import { provideTmdbImageLoader } from './data-access/images/image-loader';
import { tmdbContentTypeInterceptor } from './data-access/api/tmdbContentTypeInterceptor';
import { requestTimingInterceptor } from './data-access/api/http-timing.interceptor';

import { tmdbReadAccessInterceptor } from './auth/tmdb-http-interceptor.feature';

import { Observable } from 'rxjs';
import { readFile } from 'node:fs';

@Injectable()
class IconLoadStrategySsr implements SvgLoadStrategy {
  load(url: string): Observable<string> {
    return new Observable<string>((observer) => {
      readFile(resolve(url), { encoding: 'utf8' }, (error, data) => {
        if (error) {
          observer.error(error);
        } else {
          observer.next(data);
        }
      });
    });
  }
}

const serverOverrides = {
  providers: [
    provideServerRendering(),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        tmdbContentTypeInterceptor,
        tmdbReadAccessInterceptor,
        requestTimingInterceptor(({ urlWithParams}) => {
          return urlWithParams.replace('https://api.themoviedb.org/3','api' );
        }),
      ]),
    ),
    provideTmdbImageLoader(),
    provideFastSVG({
      url: (name: string) =>
        join(cwd(), 'dist', 'projects', 'movies', 'browser', 'assets', 'svg-icons', `${name}.svg`),
      svgLoadStrategy: IconLoadStrategySsr,
    }),
    {
      provide: RX_RENDER_STRATEGIES_CONFIG,
      useValue: { primaryStrategy: 'native' },
    },
  ],
} satisfies ApplicationConfig;

export default mergeApplicationConfig(appConfig, serverOverrides);
