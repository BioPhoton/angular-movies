import {RxState} from '@rx-angular/state';
import {DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, TrackByFunction, ViewEncapsulation,} from '@angular/core';
import {NavigationEnd, Router, RouterLink} from '@angular/router';
import {distinctUntilChanged, filter, map, shareReplay, switchMap,} from 'rxjs';
import {TMDBMovieGenreModel} from '../data-access/api/model/movie-genre.model';
import {trackByProp} from '../shared/cdk/track-by';
import {RxActionFactory} from '@rx-angular/state/actions';
import {fallbackRouteToDefault, RouterState,} from '../shared/router/router.state';
import {getIdentifierOfTypeAndLayoutUtil} from '../shared/router/get-identifier-of-type-and-layout.util';
import {GenreResource} from '../data-access/api/resources/genre.resource';
import {RxEffects} from '@rx-angular/state/effects';
import {HamburgerButtonComponent} from '../ui/component/hamburger-button/hamburger-button.component';
import {RxLet} from '@rx-angular/template/let';
import {SideDrawerComponent} from '../ui/component/side-drawer/side-drawer.component';
import {SearchBarComponent} from '../ui/component/search-bar/search-bar.component';
import {DarkModeToggleComponent} from '../ui/component/dark-mode-toggle/dark-mode-toggle.component';
import {RxFor} from '@rx-angular/template/for';
import {LazyDirective} from '../shared/cdk/lazy/lazy.directive';
import {FastSvgComponent} from '@push-based/ngx-fast-svg';
import { SpeculativeLinkDirective } from '../shared/cdk/speculative-link/speculative-link.directive';

type Actions = {
  sideDrawerOpenToggle: boolean;
  loadAccountMenu: void;
};

@Component({
  standalone: true,
  imports: [
    RouterLink,
    RxLet,
    RxFor,
    FastSvgComponent,
    HamburgerButtonComponent,
    SideDrawerComponent,
    SearchBarComponent,
    DarkModeToggleComponent,
    LazyDirective,
    SpeculativeLinkDirective
  ],
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
  providers: [RxState, RxEffects, RxActionFactory],
})
export class AppShellComponent {
  private readonly state =
    inject<RxState<{ sideDrawerOpen: boolean }>>(RxState);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  public readonly routerState = inject(RouterState);
  public readonly effects = inject(RxEffects);
  public genreResource = inject(GenreResource);
  readonly ui = this.actionsF.create();

  search$ = this.routerState.select(
    getIdentifierOfTypeAndLayoutUtil('search', 'list')
  );

  accountMenuComponent$ = this.ui.loadAccountMenu$.pipe(
    switchMap(() =>
      import('./account-menu/account-menu.component').then((x) => x.default)
    ),
    shareReplay(1)
  );

  constructor(private actionsF: RxActionFactory<Actions>) {
    this.state.set({sideDrawerOpen: false});
    this.state.connect('sideDrawerOpen', this.ui.sideDrawerOpenToggle$);

    this.effects.register(
      this.router.events.pipe(
        filter((e) => e instanceof NavigationEnd),
        map((e) => (e as NavigationEnd).urlAfterRedirects),
        distinctUntilChanged()
      ),
      () => this.closeSidenav()
    );
    /**
     * **🚀 Perf Tip for TBT:**
     *
     * Disable initial sync navigation in router config and schedule it in router-outlet container component.
     * We use a scheduling API (setTimeout) to run it in a separate task from the bootstrap phase
     */
    setTimeout(() => {
      this.router.navigate([
        // The pathname route seems to work correctly on SSR but when pre-rendering it is an empty string.
        // We have to fall back to document URL as a fix.
        fallbackRouteToDefault(
          this.document.location.pathname || this.document.URL
        ),
      ]);
    });
  }

  readonly genres$ = this.genreResource.getGenresCached();

  readonly viewState$ = this.state.select();

  readonly trackByGenre: TrackByFunction<TMDBMovieGenreModel> =
    trackByProp<TMDBMovieGenreModel>('name');

  searchMovie(term: string) {
    term === ''
      ? this.router.navigate(['list/category/popular'])
      : this.router.navigate([`list/search/${term}`]);
  }

  closeSidenav = () => {
    this.ui.sideDrawerOpenToggle(false);
  };
}
