import {Component, inject} from '@angular/core';
import {NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet} from '@angular/router';
import {initFlowbite} from 'flowbite';
import {LoadingService} from './services/loading.service';
import {Subscription} from 'rxjs';
import {MatProgressBar} from '@angular/material/progress-bar';
import {AsyncPipe, NgIf} from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatProgressBar, NgIf, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  private sub = new Subscription();
  router = inject(Router)
  loading = inject(LoadingService)

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  ngOnInit(): void {
    //alert('Hello World!')
    initFlowbite();
    this.sub.add(
      this.router.events.subscribe(e => {
        if (e instanceof NavigationStart) this.loading.show();
        if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) this.loading.hide();
      })
    );
  }
}
