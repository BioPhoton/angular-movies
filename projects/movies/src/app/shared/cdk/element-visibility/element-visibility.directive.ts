import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, inject, Output, PLATFORM_ID } from '@angular/core';
import { rxActions } from '@rx-angular/state/actions';
import { observeElementVisibility } from './observe-element-visibility';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Directive({
  standalone: true,
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[elementVisibility]',
})
export class ElementVisibilityDirective {
  private readonly platformId = inject(PLATFORM_ID);

  #visibilityEffect = rxActions<{ isVisible: boolean }>();

  @Output()
  elementVisibility = this.#visibilityEffect.isVisible$;

  constructor(elRef: ElementRef) {
    if (isPlatformBrowser(this.platformId)) {
      observeElementVisibility(elRef.nativeElement)
        .pipe(takeUntilDestroyed())
        .subscribe(this.#visibilityEffect.isVisible);
    }
  }
}
