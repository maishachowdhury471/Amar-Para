import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Post, categoryColor, categoryLabel } from '../../core/models';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <article class="rounded-2xl border bg-white p-4 shadow-sm">
      <div class="flex flex-wrap items-center gap-2">
        <span class="rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="catColor">
          {{ catLabel }}
        </span>
        @if (post.is_pinned) {
          <span class="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
            📌 পিন করা
          </span>
        }
        @if (post.status === 'solved') {
          <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            ✓ সমাধান হয়েছে
          </span>
        }
        <span class="ml-auto text-xs text-gray-500">{{ post.created_at | date: 'd MMM, h:mm a' }}</span>
      </div>

      <a [routerLink]="['/post', post.id]" class="mt-2 block text-lg font-bold leading-snug text-gray-900 hover:text-emerald-700">
        {{ post.title }}
      </a>
      <p class="mt-1 line-clamp-3 text-sm text-gray-600">{{ post.body }}</p>

      @if (post.photos?.length) {
        <img [src]="post.photos![0]" alt="পোস্টের ছবি"
          class="mt-3 h-44 w-full rounded-xl object-cover" />
      }

      <div class="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <a [routerLink]="['/profile', post.author_username]" class="font-semibold text-emerald-700">
          {{ post.author_username }}
        </a>
        @if (post.para_name) {
          <span>· {{ post.para_name }}</span>
        }
        @if (post.gram_name) {
          <span>· {{ post.gram_name }}</span>
        }
        <span class="ml-auto">💬 {{ post.comments_count ?? 0 }}টি উত্তর</span>
      </div>

      <div class="mt-3 flex gap-2">
        <a [routerLink]="['/post', post.id]"
          class="flex-1 rounded-xl bg-emerald-600 py-2 text-center text-sm font-bold text-white hover:bg-emerald-700">
          বিস্তারিত দেখুন
        </a>
        @if (post.phone) {
          <a [href]="'tel:' + post.phone"
            class="flex-1 rounded-xl border-2 border-emerald-600 py-2 text-center text-sm font-bold text-emerald-700">
            📞 কল করুন
          </a>
        }
      </div>
    </article>
  `,
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;
  get catLabel(): string {
    return categoryLabel(this.post.category);
  }
  get catColor(): string {
    return categoryColor(this.post.category);
  }
}
