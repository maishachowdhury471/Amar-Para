import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectCurrentUser, selectIsAdmin } from '../../store/auth/auth.selectors';
import { selectUnreadCount } from '../../store/notifications/notifications.selectors';
import * as AuthActions from '../../store/auth/auth.actions';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-40 bg-emerald-700 text-white shadow">
      <div class="mx-auto flex max-w-3xl items-center gap-2 px-3 py-3">
        <a routerLink="/feed" class="text-xl font-extrabold">🏡 আমার পাড়া</a>
        <span class="hidden text-xs opacity-80 sm:inline">গ্রামের নোটিশ বোর্ড</span>
        <div class="ml-auto flex items-center gap-1 text-sm">
          <a routerLink="/notifications" class="relative rounded-lg px-2 py-1 hover:bg-emerald-600">
            🔔
            @if ((unread$ | async); as n) {
              @if (n > 0) {
                <span class="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[11px] font-bold">{{ n }}</span>
              }
            }
          </a>
          @if (isAdmin$ | async) {
            <a routerLink="/admin" routerLinkActive="bg-emerald-600" class="rounded-lg px-2 py-1 hover:bg-emerald-600">অ্যাডমিন</a>
          }
          <a routerLink="/me" class="rounded-lg px-2 py-1 hover:bg-emerald-600">
            {{ (user$ | async)?.username ?? 'প্রোফাইল' }}
          </a>
          <button (click)="logout()" class="rounded-lg bg-emerald-800 px-2 py-1 hover:bg-emerald-900">লগআউট</button>
        </div>
      </div>
      <nav class="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-3 pb-2 text-sm font-semibold">
        <a routerLink="/feed" routerLinkActive="bg-white text-emerald-700" class="whitespace-nowrap rounded-full px-3 py-1.5">ফিড</a>
        <a routerLink="/create-post" routerLinkActive="bg-white text-emerald-700" class="whitespace-nowrap rounded-full px-3 py-1.5">+ নতুন পোস্ট</a>
        <a routerLink="/solved" routerLinkActive="bg-white text-emerald-700" class="whitespace-nowrap rounded-full px-3 py-1.5">সমাধান</a>
        <a routerLink="/dustbin" routerLinkActive="bg-white text-emerald-700" class="whitespace-nowrap rounded-full px-3 py-1.5">ডাস্টবিন</a>
        <a routerLink="/ads" routerLinkActive="bg-white text-emerald-700" class="whitespace-nowrap rounded-full px-3 py-1.5">বিজ্ঞাপন</a>
      </nav>
    </header>
  `,
})
export class HeaderComponent {
  private store = inject(Store);
  private router = inject(Router);
  user$ = this.store.select(selectCurrentUser);
  unread$ = this.store.select(selectUnreadCount);
  isAdmin$ = this.store.select(selectIsAdmin);

  logout(): void {
    this.store.dispatch(AuthActions.logout());
    this.router.navigate(['/login']);
  }
}
