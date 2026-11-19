import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { HeaderComponent } from './shared/components/header.component';
import { selectIsLoggedIn } from './store/auth/auth.selectors';
import * as AuthActions from './store/auth/auth.actions';
import * as NotificationActions from './store/notifications/notifications.actions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  template: `
    @if (loggedIn$ | async) {
      <app-header></app-header>
    }
    <main class="min-h-screen bg-gray-50 pb-16">
      <router-outlet></router-outlet>
    </main>
    <footer class="border-t bg-white py-4 text-center text-xs text-gray-500">
      আমার পাড়া — আপনার গ্রামের নোটিশ বোর্ড
    </footer>
  `,
})
export class AppComponent implements OnInit {
  private store = inject(Store);
  loggedIn$ = this.store.select(selectIsLoggedIn);

  ngOnInit(): void {
    // পাতা রিফ্রেশ হলেও টোকেন থাকলে নিজের তথ্য আবার আনুন
    if (localStorage.getItem('amarpara_token')) {
      this.store.dispatch(AuthActions.loadMe());
      this.store.dispatch(NotificationActions.loadNotifications());
    }
  }
}
