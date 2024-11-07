import {NgOptimizedImage} from '@angular/common';
import {RxState} from '@rx-angular/state';
import {ChangeDetectionStrategy, Component, inject, Input, Output, ViewEncapsulation,} from '@angular/core';
import {filter, map, Observable} from 'rxjs';
import {RxActionFactory} from '@rx-angular/state/actions';
import {coerceObservable} from '../../../shared/cdk/coerceObservable';
import {RxInputType} from '../../../shared/cdk/input-type.typing';
import {RouterLink} from '@angular/router';
import {StarRatingComponent} from '../star-rating/star-rating.component';
import {RxFor} from '@rx-angular/template/for';
import {ElementVisibilityDirective} from '../../../shared/cdk/element-visibility/element-visibility.directive';
import {FastSvgComponent} from '@push-based/ngx-fast-svg';
import {GridListComponent} from '../../component/grid-list/grid-list.component';
import {RxIf} from '@rx-angular/template/if';
import {Movie} from '../../../state/movie.state';
import { SpeculativeLinkDirective } from '../../../shared/cdk/speculative-link/speculative-link.directive';

type UiActions = { paginate: boolean };

@Component({
  standalone: true,
  imports: [
    RouterLink,
    StarRatingComponent,
    RxFor,
    ElementVisibilityDirective,
    FastSvgComponent,
    GridListComponent,
    RxIf,
    NgOptimizedImage,
    SpeculativeLinkDirective
  ],
  selector: 'ui-movie-list',
  template: `
    <ui-grid-list *rxIf="moviesListVisible$; else noData">
      <!--
          **🚀 Perf Tip for TBT:**
          Use \`rxFor\` in favour of \`ngFor\` to get non blocking rendering of lists.
          This reduces drastically the TBT measure.
      -->
      <a
        class="ui-grid-list-item"
        *rxFor="let movie of movies$; index as idx; trackBy: trackByMovieId"
        [speculativeLink]='"/detail/movie/" + movie.id'
        [routerLink]="['/detail/movie', movie.id]"
        [attr.data-uf]="'movie-' + idx"
      >
        <!--
          **🚀 Perf Tip for LCP:**
          To get out the best performance use the native HTML attribute loading="lazy" instead of a directive.
          This avoids bootstrap and template evaluation time and reduces scripting time in general.
          -->
        <img
          [ngSrc]="movie.imgSrc"
          [ngSrcset]="movie.imgSrcset"
          [sizes]="movie.imgSizes"
          [priority]="idx < numPriority()"
          class="aspectRatio-2-3 gradient"
          [width]="movie.imgWidth"
          [height]="movie.imgHeight"
          alt="poster movie"
          [title]="movie.title"
        />
        <div class="movies-list--details">
          <h3 class="movies-list--details-title">
            {{ movie.title }}
          </h3>
          <ui-star-rating [rating]="movie.vote_average"></ui-star-rating>
        </div>
      </a>
      <!-- If this element is visible in the viewport the paginate event fires -->
      <div (elementVisibility)="ui.paginate($event)"></div>
    </ui-grid-list>
    <ng-template #noData>
      <div style="display: flex; align-items: center;">
        <span style="font-size: 1.5rem">No results</span>
        <fast-svg name="sad"></fast-svg>
      </div>
    </ng-template>
  `,
  styleUrls: ['./movie-list.component.scss'],
  providers: [RxState, RxActionFactory],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
})
export class MovieListComponent {
  private readonly state =
    inject<RxState<{ movies?: Movie[]; numPriority: number }>>(RxState);
  ui = this.actions.create();

  numPriority() {
    return this.state.get('numPriority');
  }

  @Input()
  set withImgPriority(p: number) {
    if (p) {
      this.state.set({numPriority: p});
    } else {
      this.state.set({numPriority: 0});
    }
  }

  readonly movies$ = this.state.select('movies') as Observable<Movie[]>;

  // if no movies are given we don't need to render nor listen for the infinite scroll trigger
  readonly moviesListVisible$ = this.state.select(
    map((state) => !!state.movies && state.movies.length > 0)
  );

  @Input({required: true})
  set movies(movies$: RxInputType<Movie[]>) {
    // eslint-disable-next-line @rx-angular/no-rxstate-subscriptions-outside-constructor
    this.state.connect('movies', coerceObservable(movies$));
  }

  // emit paginate event only if element is visible (true)
  @Output() readonly paginate: Observable<true> = this.ui.paginate$.pipe(
    filter(Boolean)
  );

  constructor(private actions: RxActionFactory<UiActions>) {
    this.state.set({ numPriority: 2 });
  }

  trackByMovieId(_: number, movie: Movie) {
    return movie.id;
  }
}
