import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { ApiService } from '../../core/services/api.service';
import { Post, User } from '../../core/models';
import { PostCardComponent } from '../../shared/components/post-card.component';
import { selectCurrentUser } from '../../store/auth/auth.selectors';

@Component({
  selector: 'app-me',
  standalone: true,
  imports: [CommonModule, PostCardComponent],
  template: `
    <div class="mx-auto max-w-3xl px-3 py-4">
      @if (user$ | async; as user) {
        <div class="rounded-2xl border bg-white p-6 text-center shadow-sm">
          <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-3xl font-extrabold text-white">
            {{ user.username.charAt(0).toUpperCase() }}
          </div>
          <h1 class="mt-3 text-2xl font-extrabold">{{ user.username }}</h1>
          <p class="mt-1 text-gray-600">📍 {{ user.para_name }}, {{ user.gram_name }}</p>
          <p class="text-sm text-gray-500">📞 {{ user.phone }}</p>
          <p class="mt-2 text-sm font-semibold text-emerald-700">
            আজ আপনি {{ user.posts_today ?? 0 }}টি পোস্ট করেছেন (দিনে সর্বোচ্চ ২টি)
          </p>
        </div>

        <h2 class="mt-5 text-lg font-bold">আমার পোস্ট ({{ posts.length }}টি)</h2>
        <div class="mt-2 space-y-3">
          @for (p of posts; track p.id) {
            <app-post-card [post]="p"></app-post-card>
          } @empty {
            <p class="rounded-2xl border bg-white p-6 text-center text-gray-500">আপনি এখনো কোনো পোস্ট দেননি।</p>
          }
        </div>
      } @else {
        <p class="py-10 text-center text-gray-500">প্রোফাইল আসছে…</p>
      }
    </div>
  `,
})
export class MeComponent implements OnInit {
  private store = inject(Store);
  private api = inject(ApiService);
  user$ = this.store.select(selectCurrentUser);
  posts: Post[] = [];

  ngOnInit(): void {
    this.api.getMe().subscribe((u: User) => {
      this.api.getUserPosts(u.id).subscribe((posts) => (this.posts = posts));
    });
  }
}
