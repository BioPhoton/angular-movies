import { RxActionFactory } from '@rx-angular/state/actions';
import {
  provideRouter,
  withDisabledInitialNavigation,
  withInMemoryScrolling,
} from '@angular/router';
import { ROUTES } from './routes';
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideFastSVG } from '@push-based/ngx-fast-svg';
import { provideClientHydration } from '@angular/platform-browser';
import { withGobalStateInitializer } from './state/state-app-initializer.provider';
import { tmdbContentTypeInterceptor } from './data-access/api/tmdbContentTypeInterceptor';
import { tmdbReadAccessInterceptor } from './auth/tmdb-http-interceptor.feature';
import { provideTmdbImageLoader } from './data-access/images/image-loader';
import { RX_RENDER_STRATEGIES_CONFIG } from '@rx-angular/cdk/render-strategies';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideHttpClient(
      withInterceptors([tmdbContentTypeInterceptor, tmdbReadAccessInterceptor])
    ),
    provideTmdbImageLoader(),
    provideRouter(
      ROUTES,
      // withDebugTracing(),
      /**
       * **🚀 Perf Tip for TBT:**
       *
       * Disable initial sync navigation in router config and schedule it in router-outlet container component
       */
      withDisabledInitialNavigation(),
      withInMemoryScrolling({
        /**
         * **💡 UX Tip for InfiniteScroll:**
         *
         * Reset scroll position to top on route change, users could be
         * irritated starting a new list from the bottom of the page.
         *
         * also: otherwise infinite scroll isn't working properly
         */
        scrollPositionRestoration: 'top',
      })
    ),
    provideFastSVG({
      url: (name: string) => `assets/svg-icons/${name}.svg`,
    }),
    RxActionFactory,
    /**
     * **🚀 Perf Tip for LCP, TTI:**
     *
     * Fetch data visible in viewport on app bootstrap instead of component initialization.
     */
    withGobalStateInitializer(),
    /**
     * **🚀 Perf Tip for TBT:**
     *
     * Chunk app bootstrap over APP_INITIALIZER.
     */
    {
      provide: APP_INITIALIZER,
      useFactory: () => (): Promise<void> =>
        new Promise<void>((resolve) => {
          setTimeout(() => resolve());
        }),
      deps: [],
      multi: true,
    },
    /**
     * **🚀 Perf Tip for TBT, LCP, CLS:**
     *
     * Configure RxAngular to get maximum performance.
     */
    {
      provide: RX_RENDER_STRATEGIES_CONFIG,
      useValue: { patchZone: false },
    },
  ],
};
