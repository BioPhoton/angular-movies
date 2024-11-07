import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withDisabledInitialNavigation, withInMemoryScrolling, withPreloading } from '@angular/router';
import { ROUTES } from './routes';
import { RxActionFactory } from '@rx-angular/state/actions';
import { withGobalStateInitializer } from './state/state-app-initializer.provider';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideTmdbImageLoader } from './data-access/images/image-loader';
import { tmdbContentTypeInterceptor } from './data-access/api/tmdbContentTypeInterceptor';
import { tmdbReadAccessInterceptor } from './auth/tmdb-http-interceptor.feature';
import { provideFastSVG } from '@push-based/ngx-fast-svg';
import { APP_INITIALIZER, ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { RX_RENDER_STRATEGIES_CONFIG } from '@rx-angular/cdk/render-strategies';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { SpeculativeLinkPreloader } from './shared/cdk/speculative-link/speculative-link-preloader.service';

export default {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideClientHydration(),
    provideRouter(
      ROUTES,
      // withDebugTracing(),
      withPreloading(SpeculativeLinkPreloader),
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
    // global actions
    RxActionFactory,
    /**
     * **🚀 Perf Tip for LCP, TTI:**
     *
     * Fetch data visible in viewport on app bootstrap instead of component initialization.
     */
    withGobalStateInitializer(),
    provideHttpClient(
      withFetch(),
      withInterceptors([tmdbContentTypeInterceptor, tmdbReadAccessInterceptor])
    ),
    provideTmdbImageLoader(),
    provideFastSVG({
      url: (name: string) => `assets/svg-icons/${name}.svg`,
    }),
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
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
} satisfies ApplicationConfig;
