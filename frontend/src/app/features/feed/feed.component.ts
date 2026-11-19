import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ApiService } from '../../core/services/api.service';
import { CATEGORIES, Gram, Para } from '../../core/models';
import { selectAllPosts, selectPinnedPosts, selectOpenPosts, selectPostsLoading, selectPostsError } from '../../store/posts/posts.selectors';
import * as PostsActions from '../../store/posts/posts.actions';
import { PostCardComponent } from '../../shared/components/post-card.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PostCardComponent],
  template: `
    <div class="mx-auto max-w-3xl px-3 py-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-extrabold">সবার পোস্ট</h1>
        <a routerLink="/create-post" class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">
          + নতুন পোস্ট
        </a>
      </div>

      <!-- সার্চ -->
      <div class="mt-3 flex gap-2">
        <input [(ngModel)]="q" (keyup.enter)="applyFilters()" placeholder="খুঁজুন… (যেমন: মিস্ত্রি, বই)"
          class="flex-1 rounded-xl border px-4 py-3 text-base" />
        <button (click)="applyFilters()" class="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white">খুঁজুন</button>
      </div>

      <!-- ক্যাটাগরি -->
      <div class="mt-3 flex flex-wrap gap-2">
        <button (click)="setCategory('')" [class.bg-emerald-600]="!category" [class.text-white]="!category"
          class="rounded-full border px-3 py-1.5 text-sm font-semibold">সব</button>
        @for (c of categories; track c.key) {
          <button (click)="setCategory(c.key)" [class.bg-emerald-600]="category === c.key"
            [class.text-white]="category === c.key"
            class="rounded-full border px-3 py-1.5 text-sm font-semibold">{{ c.label }}</button>
        }
      </div>

      <!-- গ্রাম / পাড়া -->
      <div class="mt-3 grid grid-cols-2 gap-2">
        <select [(ngModel)]="gramId" (ngModelChange)="onGramChange()" class="rounded-xl border px-3 py-2.5 text-sm">
          <option [ngValue]="undefined">সব গ্রাম</option>
          @for (g of grams; track g.id) {
            <option [ngValue]="g.id">{{ g.name }}</option>
          }
        </select>
        <select [(ngModel)]="paraId" (ngModelChange)="applyFilters()" class="rounded-xl border px-3 py-2.5 text-sm">
          <option [ngValue]="undefined">সব পাড়া</option>
          @for (p of paras; track p.id) {
            <option [ngValue]="p.id">{{ p.name }}</option>
          }
        </select>
      </div>

      @if (error$ | async; as err) {
        <p class="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ err }}</p>
      }

      @if (loading$ | async) {
        <p class="mt-6 text-center text-gray-500">পোস্ট আসছে…</p>
      }

      <!-- পিন করা পোস্ট উপরে -->
      @if ((pinned$ | async)?.length) {
        <h2 class="mt-5 text-lg font-bold">📌 পিন করা পোস্ট</h2>
        <div class="mt-2 space-y-3">
          @for (p of pinned$ | async; track p.id) {
            <app-post-card [post]="p"></app-post-card>
          }
        </div>
      }

      <h2 class="mt-5 text-lg font-bold">সব পোস্ট</h2>
      <div class="mt-2 space-y-3">
        @for (p of open$ | async; track p.id) {
          <app-post-card [post]="p"></app-post-card>
        } @empty {
          @if (!(loading$ | async)) {
            <p class="rounded-2xl border bg-white p-6 text-center text-gray-500">
              এখনো কোনো পোস্ট নেই। প্রথম পোস্টটি আপনিই দিন!
            </p>
          }
        }
      </div>
    </div>
  `,
})
export class FeedComponent implements OnInit {
  private store = inject(Store);
  private api = inject(ApiService);

  categories = CATEGORIES;
  grams: Gram[] = [];
  paras: Para[] = [];
  q = '';
  category = '';
  gramId?: number;
  paraId?: number;

  posts$ = this.store.select(selectAllPosts);
  pinned$ = this.store.select(selectPinnedPosts);
  open$ = this.store.select(selectOpenPosts);
  loading$ = this.store.select(selectPostsLoading);
  error$ = this.store.select(selectPostsError);

  ngOnInit(): void {
    this.api.getGrams().subscribe((g) => (this.grams = g));
    this.applyFilters();
  }

  onGramChange(): void {
    this.paraId = undefined;
    this.paras = [];
    if (this.gramId) {
      this.api.getParas(this.gramId).subscribe((p) => (this.paras = p));
    }
    this.applyFilters();
  }

  setCategory(key: string): void {
    this.category = key;
    this.applyFilters();
  }

  applyFilters(): void {
    this.store.dispatch(
      PostsActions.loadPosts({
        filters: {
          category: this.category || undefined,
          gram_id: this.gramId,
          para_id: this.paraId,
          q: this.q.trim() || undefined,
          status: 'open',
        },
      }),
    );
  }
}
