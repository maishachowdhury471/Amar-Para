import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectAllNotifications, selectNotificationsLoading, selectUnreadCount } from '../../store/notifications/notifications.selectors';
import * as N from '../../store/notifications/notifications.actions';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto max-w-3xl px-3 py-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-extrabold">নোটিফিকেশন</h1>
        <button (click)="markAllRead()" class="rounded-xl border px-3 py-2 text-sm font-bold text-emerald-700">
          সব পড়া হয়েছে চিহ্ন দিন
        </button>
      </div>
      <p class="mt-1 text-sm text-gray-600">অপঠিত: {{ unread$ | async }}টি</p>

      @if (loading$ | async) {
        <p class="mt-6 text-center text-gray-500">আসছে…</p>
      }

      <div class="mt-3 space-y-3">
        @for (n of notifications$ | async; track n.id) {
          <div class="rounded-2xl border bg-white p-4 shadow-sm" [class.bg-emerald-50]="!n.is_read">
            <div class="flex items-start gap-2">
              <div class="flex-1">
                <p class="font-bold">{{ n.title }}</p>
                <p class="mt-1 text-sm text-gray-600">{{ n.body }}</p>
                <p class="mt-1 text-xs text-gray-400">{{ n.created_at | date: 'd MMM yyyy, h:mm a' }}</p>
              </div>
              @if (!n.is_read) {
                <span class="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">নতুন</span>
              }
            </div>
            <div class="mt-2 flex gap-2">
              @if (n.post_id) {
                <a [routerLink]="['/post', n.post_id]" class="text-sm font-bold text-emerald-700 underline">পোস্টটি দেখুন</a>
              }
              @if (!n.is_read) {
                <button (click)="markRead(n.id)" class="text-sm font-semibold text-gray-600 underline">পড়া হয়েছে</button>
              }
            </div>
          </div>
        } @empty {
          @if (!(loading$ | async)) {
            <p class="rounded-2xl border bg-white p-6 text-center text-gray-500">কোনো নোটিফিকেশন নেই।</p>
          }
        }
      </div>
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private store = inject(Store);
  notifications$ = this.store.select(selectAllNotifications);
  unread$ = this.store.select(selectUnreadCount);
  loading$ = this.store.select(selectNotificationsLoading);

  ngOnInit(): void {
    this.store.dispatch(N.loadNotifications());
  }

  markRead(id: number): void {
    this.store.dispatch(N.markRead({ id }));
  }

  markAllRead(): void {
    this.store.dispatch(N.markAllRead());
  }
}
