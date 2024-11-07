import { Injectable, inject } from '@angular/core';
import { PreloadingStrategy, Route, RouteConfigLoadEnd, Router } from '@angular/router';

import { EMPTY, Observable, filter, tap } from 'rxjs';

import { PrefetchRegistry } from './prefetch-registry.service';
import schedule from './schedule';

@Injectable({ providedIn: 'root' })
export class SpeculativeLinkPreloader implements PreloadingStrategy {
    #loading = new Set<Route>();
    #registry = inject(PrefetchRegistry);

    constructor(router: Router) {
        router.events
            .pipe(
                filter((event): event is RouteConfigLoadEnd => event instanceof RouteConfigLoadEnd),
                tap((event) => {
                    /**
                     * The idleCallback is necessary because routes have loaded but not yet processed, the fields we
                     * access to load the preResolvers and the required data like _loadRoutes are only present after
                     * it's done processing.
                     */
                    schedule(() => this.#registry.registerRoutes(event.route));
                }),
            )
            .subscribe();
    }

    preload(route: Route, load: () => Observable<void>): Observable<void> {
        if (this.#loading.has(route)) {
            // Don't preload the same route twice
            return EMPTY;
        }
        const conn = typeof navigator !== 'undefined' ? (navigator as any).connection : undefined;
        if (conn) {
            // Don't preload if the user is on 2G. or if Save-Data is enabled.
            if ((conn.effectiveType || '').includes('2g') || conn.saveData) return EMPTY;
        }
        // Prevent from preloading
        if (route.data && route.data['preload'] === false) {
            return EMPTY;
        }

        if (this.#registry.shouldPrefetch(route)) {
            this.#loading.add(route);
            return load();
        }

        return EMPTY;
    }


}
