import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Post, User } from '../../core/models';
import { PostCardComponent } from '../../shared/components/post-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, PostCardComponent],
  template: `
    <div class="mx-auto max-w-3xl px-3 py-4">
      @if (user) {
        <div class="rounded-2xl border bg-white p-6 text-center shadow-sm">
          <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-3xl font-extrabold text-white">
            {{ user.username.charAt(0).toUpperCase() }}
          </div>
          <h1 class="mt-3 text-2xl font-extrabold">{{ user.username }}</h1>
          <p class="mt-1 text-gray-600">📍 {{ user.para_name }}, {{ user.gram_name }}</p>
          <p class="text-sm text-gray-500">📞 {{ user.phone }}</p>
          @if (user.is_admin) {
            <span class="mt-2 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">অ্যাডমিন</span>
          }
        </div>

        <h2 class="mt-5 text-lg font-bold">এই ব্যবহারকারীর পোস্ট ({{ posts.length }}টি)</h2>
        <div class="mt-2 space-y-3">
          @for (p of posts; track p.id) {
            <app-post-card [post]="p"></app-post-card>
          } @empty {
            <p class="rounded-2xl border bg-white p-6 text-center text-gray-500">এখনো কোনো পোস্ট নেই।</p>
          }
        </div>
      } @else if (error) {
        <p class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ error }}</p>
        <a routerLink="/feed" class="mt-3 inline-block font-bold text-emerald-700 underline">← ফিডে ফিরুন</a>
      } @else {
        <p class="py-10 text-center text-gray-500">প্রোফাইল আসছে…</p>
      }
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  user: User | null = null;
  posts: Post[] = [];
  error: string | null = null;

  ngOnInit(): void {
    const username = this.route.snapshot.paramMap.get('username')!;
    this.api.getUserByUsername(username).subscribe({
      next: (u) => {
        this.user = u;
        this.api.getUserPosts(u.id).subscribe((posts) => (this.posts = posts));
      },
      error: () => (this.error = 'এই নামের ব্যবহারকারী পাওয়া যায়নি।'),
    });
  }
}
