import { computed, Directive, effect, ElementRef, inject, input, OnDestroy, PLATFORM_ID } from '@angular/core';
import { Router, UrlTree } from "@angular/router";
import { DOCUMENT, isPlatformServer } from '@angular/common';
import { SpeculativeLinkObserver } from "./speculative-link-observer.service";

/**
 *
 * Inspired by the [Speculation Rules API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API}
 *
 * @whatItDoes When the link is observed in the viewport it will preload its route and execute its preResolvers.
 *
 */

@Directive({
  standalone: true,
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[speculativeLink]'
})
export class SpeculativeLinkDirective implements OnDestroy {
    readonly href = input.required<string>({ alias: 'speculativeLink' });

    readonly #router = inject(Router);
    readonly #document = inject(DOCUMENT);
    readonly #platformId = inject(PLATFORM_ID);

    public readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    readonly #observer = inject(SpeculativeLinkObserver);

    registeredTree: UrlTree | null = null;

    urlTree = computed(() => {
      // return null;
      if (isPlatformServer(this.#platformId)) {
        return null;
      }
      const href = this.href();
      if (href === null) {
            return null;
        }
        if (!href.includes('http')) {
            return this.#router.parseUrl(href);
        }
        const url = new URL(href);
        if (this.#document.location.hostname !== url.hostname) {
            return null;
        }
        return this.#router.parseUrl(url.pathname);
    });

    #register = effect(() => {
        this.#observer.unregister(this);
        if (this.urlTree()) {
            this.#observer.register(this);
        }
        this.registeredTree = this.urlTree();
    });

    ngOnDestroy(): void {
        this.#observer.unregister(this);
        this.#register.destroy();
    }
}
