import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { CATEGORIES, categoryColor, categoryLabel } from '../../core/models';
import {
  selectComments,
  selectPostsError,
  selectPostsMessage,
  selectSelectedPost,
} from '../../store/posts/posts.selectors';
import * as PostsActions from '../../store/posts/posts.actions';
import { selectCurrentUser } from '../../store/auth/auth.selectors';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-3xl px-3 py-4">
      @if (post$ | async; as post) {
        <article class="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="catColor(post.category)">
              {{ catLabel(post.category) }}
            </span>
            @if (post.is_pinned) {
              <span class="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">📌 পিন করা</span>
            }
            @if (post.status === 'solved') {
              <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">✓ সমাধান হয়েছে</span>
            }
            <span class="ml-auto text-xs text-gray-500">{{ post.created_at | date: 'd MMM yyyy, h:mm a' }}</span>
          </div>

          <h1 class="mt-3 text-2xl font-extrabold leading-snug">{{ post.title }}</h1>
          <p class="mt-2 whitespace-pre-line text-base leading-relaxed text-gray-700">{{ post.body }}</p>

          @if (post.photos?.length) {
            <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              @for (src of post.photos; track src) {
                <img [src]="src" alt="পোস্টের ছবি" class="w-full rounded-xl object-cover" />
              }
            </div>
          }

          <div class="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <a [routerLink]="['/profile', post.author_username]" class="font-bold text-emerald-700">{{ post.author_username }}</a>
            @if (post.para_name) { <span>· {{ post.para_name }}</span> }
            @if (post.gram_name) { <span>· {{ post.gram_name }}</span> }
          </div>

          @if (post.phone) {
            <a [href]="'tel:' + post.phone"
              class="mt-4 block rounded-xl bg-emerald-600 py-3 text-center text-lg font-bold text-white">
              📞 কল করুন: {{ post.phone }}
            </a>
          }

          <!-- নিজের পোস্টের কাজ -->
          @if (isMine(post.author_id)) {
            <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              @if (post.status === 'open') {
                <button (click)="markSolved(post.id)" class="rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white">
                  ✓ হয়ে গেছে
                </button>
              }
              <button (click)="requestPin(post.id)" class="rounded-xl bg-yellow-500 py-2.5 text-sm font-bold text-white">
                📌 পিন চাই (১০০ টাকা)
              </button>
              @if (post.is_pinned) {
                <button (click)="extendPin(post.id)" class="rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white">
                  ⏱️ মেয়াদ বাড়ান
                </button>
              }
              <a [routerLink]="['/create-post']" [queryParams]="{ edit: post.id }"
                class="rounded-xl border-2 border-gray-300 py-2.5 text-center text-sm font-bold">✏️ এডিট</a>
              <button (click)="deletePost(post.id)" class="rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">
                🗑️ মুছুন
              </button>
            </div>
            <p class="mt-2 text-xs text-gray-500">
              পিন: ১০০ টাকা / ১০ দিন (অ্যাডমিনের অনুমোদন লাগবে)। মেয়াদ বাড়াতে ৫ দিনের জন্য ১০০ টাকা।
            </p>
          }

          <button (click)="report(post.id)" class="mt-3 text-sm font-semibold text-red-600 underline">
            ⚠️ এই পোস্টটি খারাপ / ভুল — রিপোর্ট করুন
          </button>

          @if (message$ | async; as msg) {
            <p class="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{{ msg }}</p>
          }
          @if (error$ | async; as err) {
            <p class="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ err }}</p>
          }
        </article>

        <!-- কমেন্ট / রিপ্লাই -->
        <section class="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
          <h2 class="text-lg font-bold">💬 উত্তর ({{ (comments$ | async)?.length ?? 0 }}টি)</h2>
          <div class="mt-3 space-y-3">
            @for (c of comments$ | async; track c.id) {
              <div class="rounded-xl bg-gray-50 p-3">
                <div class="flex items-center gap-2 text-sm">
                  <span class="font-bold text-emerald-700">{{ c.author_username }}</span>
                  <span class="text-xs text-gray-500">{{ c.created_at | date: 'd MMM, h:mm a' }}</span>
                  <button (click)="flagComment(c.id)" class="ml-auto text-xs font-semibold text-red-600">
                    🚩 ফ্ল্যাগ ({{ c.flags_count ?? 0 }})
                  </button>
                </div>
                <p class="mt-1 whitespace-pre-line text-sm">{{ c.body }}</p>
              </div>
            } @empty {
              <p class="text-sm text-gray-500">এখনো কোনো উত্তর নেই। প্রথম উত্তরটি আপনিই দিন।</p>
            }
          </div>

          <form (ngSubmit)="addComment(post.id)" class="mt-4 flex gap-2">
            <input [(ngModel)]="commentBody" name="comment" required placeholder="আপনার উত্তর লিখুন…"
              class="flex-1 rounded-xl border px-4 py-3 text-base" />
            <button type="submit" [disabled]="!commentBody.trim()"
              class="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50">
              পাঠান
            </button>
          </form>
          <p class="mt-2 text-xs text-gray-500">
            কোনো পোস্টে ৫টি খারাপ/অশালীন কমেন্ট হলে পোস্টটি নিজে থেকেই মুছে যাবে।
          </p>
        </section>
      } @else {
        <p class="py-10 text-center text-gray-500">পোস্টটি আসছে…</p>
      }
    </div>
  `,
})
export class PostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(Store);

  post$ = this.store.select(selectSelectedPost);
  comments$ = this.store.select(selectComments);
  message$ = this.store.select(selectPostsMessage);
  error$ = this.store.select(selectPostsError);
  currentUserId: number | null = null;
  commentBody = '';
  private postId = 0;

  constructor() {
    this.store.select(selectCurrentUser).subscribe((u) => (this.currentUserId = u?.id ?? null));
  }

  ngOnInit(): void {
    this.postId = Number(this.route.snapshot.paramMap.get('id'));
    this.store.dispatch(PostsActions.loadPost({ id: this.postId }));
    this.store.dispatch(PostsActions.loadComments({ postId: this.postId }));
  }

  catLabel(key: string): string {
    return categoryLabel(key);
  }
  catColor(key: string): string {
    return categoryColor(key);
  }
  isMine(authorId: number): boolean {
    return this.currentUserId === authorId;
  }

  markSolved(id: number): void {
    this.store.dispatch(PostsActions.markSolved({ id }));
  }
  requestPin(id: number): void {
    if (confirm('পিন করতে ১০০ টাকা লাগবে, ১০ দিন থাকবে। অ্যাডমিনের অনুমোদন লাগবে। আবেদন পাঠাবেন?')) {
      this.store.dispatch(PostsActions.requestPin({ id }));
    }
  }
  extendPin(id: number): void {
    if (confirm('মেয়াদ ৫ দিন বাড়াতে ১০০ টাকা লাগবে। আবেদন পাঠাবেন?')) {
      this.store.dispatch(PostsActions.extendPin({ id }));
    }
  }
  deletePost(id: number): void {
    if (confirm('পোস্টটি মুছে ফেলবেন? এই কাজ ফেরানো যাবে না।')) {
      this.store.dispatch(PostsActions.deletePost({ id }));
      this.router.navigate(['/feed']);
    }
  }
  report(id: number): void {
    const reason = prompt('কেন রিপোর্ট করছেন? সংক্ষেপে লিখুন:');
    if (reason?.trim()) {
      this.store.dispatch(PostsActions.reportPost({ id, reason: reason.trim() }));
    }
  }
  addComment(postId: number): void {
    if (!this.commentBody.trim()) return;
    this.store.dispatch(PostsActions.addComment({ postId, body: this.commentBody.trim() }));
    this.commentBody = '';
  }
  flagComment(id: number): void {
    this.store.dispatch(PostsActions.flagComment({ id }));
  }
}
