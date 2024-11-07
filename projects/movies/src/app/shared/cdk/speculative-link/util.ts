import { PRIMARY_OUTLET, Route, Routes } from '@angular/router';

export const PATTERN_ALIAS = '__MatcherPlaceholder__';

export type PathDetails = { url: string; matcherRoutes: Routes };

// copy-paste of ngx-quicklink
export const findPathDetails = (config: Routes, route: Route): PathDetails => {
    config = config.slice();
    const parent = new Map<Route, Route>();
    const visited = new Set<Route>();
    while (config.length) {
        const el = config.shift();
        if (!el) {
            continue;
        }
        visited.add(el);
        if (el === route) break;

        let children = el.children ?? (el as any)._loadedRoutes ?? [];

        const lazyChildren = (el as any)._loadedRoutes || [];

        for (const lazyChild of lazyChildren) {
            if (lazyChild && lazyChild.children) {
                children = children.concat(lazyChild.children);
            }
        }
        children.forEach((r: Route) => {
            if (visited.has(r)) return;
            parent.set(r, el);
            config.push(r);
        });
    }
    let path = '';
    let current: Route | undefined = route;
    const matcherRoutes: Routes = [];

    while (current) {
        const currentPath = current.matcher ? PATTERN_ALIAS : current.path;
        if (current.matcher) {
            matcherRoutes.unshift(current);
        }
        if (isPrimaryRoute(current)) {
            path = `/${currentPath}${path}`;
        } else {
            path = `/(${current.outlet}:${currentPath}${path})`;
        }
        current = parent.get(current);
    }
    /**
     * Remove duplicate slashes
     *  - If route contains multiple /  it will transform them only
     *    example url -> ///section///sub-section/// = /section/sub-section/
     */
    const url = path.replace(/\/+/g, '/');
    return { url, matcherRoutes };
};

export function getPreResolveRoutes(route: Route) {
    const preResolveRoutes = [];
    if (route.data?.['preResolve']) {
        preResolveRoutes.push(route);
    }

    // Angular internal method for lazy loaded routes
    const loadedRoutes = (<any>route)['_loadedRoutes'];
    const children: Routes = route.children ?? loadedRoutes;
    if (children?.length) {
        children.forEach((child) => {
            preResolveRoutes.push(...getPreResolveRoutes(child));
        });
    }
    return preResolveRoutes;
}

function isPrimaryRoute(route: Route) {
    return route.outlet === PRIMARY_OUTLET || !route.outlet;
}
