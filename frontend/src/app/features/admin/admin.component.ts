import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  selectAdminError,
  selectAdminLoading,
  selectAdminPosts,
  selectAdminStats,
  selectAdminUsers,
  selectAllPins,
  selectAllReports,
  selectPendingPins,
  selectPendingReports,
} from '../../store/admin/admin.selectors';
import * as AdminActions from '../../store/admin/admin.actions';
import { categoryLabel } from '../../core/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto max-w-5xl px-3 py-4">
      <h1 class="text-2xl font-extrabold">অ্যাডমিন ড্যাশবোর্ড</h1>
      <p class="text-sm text-gray-600">সবকিছু এখান থেকে দেখুন ও নিয়ন্ত্রণ করুন।</p>

      @if (error$ | async; as err) {
        <p class="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ err }}</p>
      }
      @if (loading$ | async) {
        <p class="mt-4 text-gray-500">তথ্য আসছে…</p>
      }

      <!-- পরিসংখ্যান কার্ড -->
      @if (stats$ | async; as s) {
        <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-2xl bg-emerald-600 p-4 text-white"><p class="text-3xl font-extrabold">{{ s.total_users }}</p><p class="text-sm">ব্যবহারকারী</p></div>
          <div class="rounded-2xl bg-sky-600 p-4 text-white"><p class="text-3xl font-extrabold">{{ s.total_posts }}</p><p class="text-sm">মোট পোস্ট</p></div>
          <div class="rounded-2xl bg-amber-500 p-4 text-white"><p class="text-3xl font-extrabold">{{ s.open_posts }}</p><p class="text-sm">খোলা পোস্ট</p></div>
          <div class="rounded-2xl bg-emerald-500 p-4 text-white"><p class="text-3xl font-extrabold">{{ s.solved_posts }}</p><p class="text-sm">সমাধান হয়েছে</p></div>
          <div class="rounded-2xl bg-gray-600 p-4 text-white"><p class="text-3xl font-extrabold">{{ s.dustbin_posts }}</p><p class="text-sm">ডাস্টবিনে</p></div>
          <div class="rounded-2xl bg-violet-600 p-4 text-white"><p class="text-3xl font-extrabold">{{ s.total_comments }}</p><p class="text-sm">মোট কমেন্ট</p></div>
          <div class="rounded-2xl bg-yellow-500 p-4 text-white"><p class="text-3xl font-extrabold">{{ s.pending_pins }}</p><p class="text-sm">পিনের অপেক্ষায়</p></div>
          <div class="rounded-2xl bg-red-500 p-4 text-white"><p class="text-3xl font-extrabold">{{ s.pending_reports }}</p><p class="text-sm">রিপোর্টের অপেক্ষায়</p></div>
        </div>

        <!-- বার গ্রাফ (নিজের SVG) -->
        <section class="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
          <h2 class="text-lg font-bold">📊 বৃদ্ধি (দৈনিক / সাপ্তাহিক / মাসিক)</h2>
          @if (s.growth.length) {
            <div class="mt-3 space-y-3">
              @for (g of s.growth; track g.label) {
                <div>
                  <div class="flex justify-between text-sm font-semibold">
                    <span>{{ g.label }}</span>
                    <span>{{ g.users }} জন · {{ g.posts }} পোস্ট</span>
                  </div>
                  <div class="mt-1 flex h-5 gap-1 overflow-hidden rounded-full bg-gray-100">
                    <div class="bg-emerald-500" [style.width.%]="barWidth(g.users, s.growth)"></div>
                    <div class="bg-sky-500" [style.width.%]="barWidth(g.posts, s.growth)"></div>
                  </div>
                </div>
              }
            </div>
            <p class="mt-2 text-xs text-gray-500">🟢 ব্যবহারকারী · 🔵 পোস্ট</p>
          } @else {
            <p class="mt-2 text-sm text-gray-500">বৃদ্ধির তথ্য এখনো নেই।</p>
          }

          @if (s.posts_by_category.length) {
            <h3 class="mt-5 font-bold">ক্যাটাগরি অনুযায়ী পোস্ট</h3>
            <div class="mt-2 space-y-2">
              @for (c of s.posts_by_category; track c.category) {
                <div class="flex items-center gap-2 text-sm">
                  <span class="w-28 font-semibold">{{ catLabel(c.category) }}</span>
                  <div class="h-4 flex-1 rounded-full bg-gray-100">
                    <div class="h-4 rounded-full bg-emerald-500"
                      [style.width.%]="(c.count / maxCategory(s.posts_by_category)) * 100"></div>
                  </div>
                  <span class="w-8 text-right font-bold">{{ c.count }}</span>
                </div>
              }
            </div>
          }
        </section>
      }

      <!-- পিন অনুমোদন সারি -->
      <section class="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 class="text-lg font-bold">📌 পিন অনুমোদনের সারি ({{ (pendingPins$ | async)?.length ?? 0 }}টি অপেক্ষায়)</h2>
        <div class="mt-3 space-y-2">
          @for (pin of pins$ | async; track pin.id) {
            <div class="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm">
              <a [routerLink]="['/post', pin.post_id]" class="font-bold text-emerald-700">{{ pin.post_title }}</a>
              <span>· {{ pin.username }}</span>
              <span>· {{ pin.amount_taka }} টাকা / {{ pin.days }} দিন</span>
              <span class="font-semibold" [ngClass]="pin.status === 'approved' ? 'text-emerald-600' : pin.status === 'rejected' ? 'text-red-600' : 'text-amber-600'">
                {{ pin.status === 'pending' ? 'অপেক্ষায়' : pin.status === 'approved' ? 'অনুমোদিত' : 'বাতিল' }}
              </span>
              @if (pin.status === 'pending') {
                <span class="ml-auto flex gap-2">
                  <button (click)="approvePin(pin.id)" class="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white">অনুমোদন</button>
                  <button (click)="rejectPin(pin.id)" class="rounded-lg bg-red-600 px-3 py-1.5 font-bold text-white">বাতিল</button>
                </span>
              }
            </div>
          } @empty {
            <p class="text-sm text-gray-500">কোনো পিনের আবেদন নেই।</p>
          }
        </div>
      </section>

      <!-- রিপোর্ট সারি -->
      <section class="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 class="text-lg font-bold">⚠️ রিপোর্টের সারি ({{ (pendingReports$ | async)?.length ?? 0 }}টি অপেক্ষায়)</h2>
        <div class="mt-3 space-y-2">
          @for (r of reports$ | async; track r.id) {
            <div class="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm">
              <a [routerLink]="['/post', r.post_id]" class="font-bold text-emerald-700">{{ r.post_title }}</a>
              <span>· রিপোর্টকারী: {{ r.reporter_username }}</span>
              <span>· কারণ: {{ r.reason }}</span>
              @if (r.status === 'pending') {
                <button (click)="resolveReport(r.id)" class="ml-auto rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white">নিষ্পত্তি করুন</button>
              } @else {
                <span class="ml-auto font-semibold text-emerald-600">নিষ্পত্তি হয়েছে</span>
              }
            </div>
          } @empty {
            <p class="text-sm text-gray-500">কোনো রিপোর্ট নেই।</p>
          }
        </div>
      </section>

      <!-- ব্যবহারকারী তালিকা -->
      <section class="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 class="text-lg font-bold">👥 ব্যবহারকারী ({{ (users$ | async)?.length ?? 0 }} জন)</h2>
        <div class="mt-3 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead><tr class="border-b text-gray-500">
              <th class="py-2">ইউজারনেম</th><th>গ্রাম</th><th>পাড়া</th><th>মোবাইল</th>
            </tr></thead>
            <tbody>
              @for (u of users$ | async; track u.id) {
                <tr class="border-b">
                  <td class="py-2 font-bold"><a [routerLink]="['/profile', u.username]" class="text-emerald-700">{{ u.username }}</a></td>
                  <td>{{ u.gram_name }}</td><td>{{ u.para_name }}</td><td>{{ u.phone }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- পোস্ট তালিকা -->
      <section class="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 class="text-lg font-bold">📝 সব পোস্ট ({{ (posts$ | async)?.length ?? 0 }}টি)</h2>
        <div class="mt-3 space-y-2">
          @for (p of posts$ | async; track p.id) {
            <div class="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm">
              <a [routerLink]="['/post', p.id]" class="font-bold text-emerald-700">{{ p.title }}</a>
              <span>· {{ p.author_username }}</span>
              <span>· {{ catLabel(p.category) }}</span>
              <span>· {{ p.status === 'solved' ? 'সমাধান' : p.status === 'dustbin' ? 'ডাস্টবিন' : 'খোলা' }}</span>
              <button (click)="deletePost(p.id)" class="ml-auto rounded-lg bg-red-600 px-3 py-1.5 font-bold text-white">মুছুন</button>
            </div>
          } @empty {
            <p class="text-sm text-gray-500">কোনো পোস্ট নেই।</p>
          }
        </div>
      </section>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  private store = inject(Store);
  stats$ = this.store.select(selectAdminStats);
  users$ = this.store.select(selectAdminUsers);
  posts$ = this.store.select(selectAdminPosts);
  pins$ = this.store.select(selectAllPins);
  reports$ = this.store.select(selectAllReports);
  pendingPins$ = this.store.select(selectPendingPins);
  pendingReports$ = this.store.select(selectPendingReports);
  loading$ = this.store.select(selectAdminLoading);
  error$ = this.store.select(selectAdminError);

  ngOnInit(): void {
    this.store.dispatch(AdminActions.loadAdminData());
  }

  catLabel(key: string): string {
    return categoryLabel(key);
  }

  barWidth(value: number, growth: { users: number; posts: number }[]): number {
    const max = Math.max(...growth.map((g) => Math.max(g.users, g.posts)), 1);
    return Math.max(4, (value / max) * 50);
  }

  maxCategory(list: { count: number }[]): number {
    return Math.max(...list.map((c) => c.count), 1);
  }

  approvePin(id: number): void {
    this.store.dispatch(AdminActions.approvePin({ id }));
  }
  rejectPin(id: number): void {
    this.store.dispatch(AdminActions.rejectPin({ id }));
  }
  resolveReport(id: number): void {
    this.store.dispatch(AdminActions.resolveReport({ id }));
  }
  deletePost(id: number): void {
    if (confirm('অ্যাডমিন হিসেবে এই পোস্টটি মুছে ফেলবেন?')) {
      this.store.dispatch(AdminActions.adminDeletePost({ id }));
    }
  }
}
