import {
  Component,
  ChangeDetectionStrategy,
  Input,
  NgModule,
  Output,
} from '@angular/core';
import { Subject } from 'rxjs';
import { RxForModule } from '../../../shared/rxa-custom/rx-for/rx-for.module';

@Component({
  selector: 'ui-tabs',
  template: `<ng-container *rxFor="let item of items; index as idx">
    <input
      (change)="tabChange.next(idx)"
      [checked]="!idx"
      type="radio"
      name="tabs"
      [id]="'tab' + idx"
    />
    <label [for]="'tab' + idx">{{ item }}</label>
  </ng-container>`,
  styleUrls: ['./tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent {
  @Input() items?: string[];
  @Output() tabChange = new Subject<number>();
  constructor() {}
}

@NgModule({
  imports: [RxForModule],
  declarations: [TabsComponent],
  exports: [TabsComponent],
})
export class TabsComponentModule {}