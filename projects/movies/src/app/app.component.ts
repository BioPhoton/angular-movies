import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RxLet } from '@rx-angular/template/let';
import { AppShellComponent } from './app-shell/app-shell.component';
import { ZonelessRouting } from './shared/zone-less/zone-less-routing.service';

@Component({
  selector: 'app-root',
  template: `
    <app-shell *rxLet="[]">
      <router-outlet />
    </app-shell>
  `,
  standalone: true,
  imports: [RouterOutlet, AppShellComponent, RxLet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  /**
   *  **🚀 Perf Tip:**
   *
   *  In zone-less applications we have to handle routing manually.
   *  This is a necessity to make it work zone-less but does not make the app faster.

   import { ZonelessRouting } from './shared/zone-agnostic/zone-less-routing.service';

   constructor(private zonelessRouting: ZonelessRouting) {
       this.zonelessRouting.init();
     }
   *
   */
  constructor() {
    inject(ZonelessRouting).init();
  }
}
