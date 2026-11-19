import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectDustbinPosts, selectSolvedPosts } from '../../store/posts/posts.selectors';
import * as PostsActions from '../../store/posts/posts.actions';
import { PostCardComponent } from '../../shared/components/post-card.component';

/** /solved এবং /dustbin — একই তালিকা কম্পোনেন্ট, রুট দেখে status বদলায়। */
@Component({
  selector: 'app-status-list',
  standalone: true,
  imports: [CommonModule, PostCardComponent],
  template: `
    <div class="mx-auto max-w-3xl px-3 py-4">
      <h1 class="text-2xl font-extrabold">{{ title }}</h1>
      <p class="mt-1 text-sm text-gray-600">{{ subtitle }}</p>
      <div class="mt-4 space-y-3">
        @for (p of posts$ | async; track p.id) {
          <app-post-card [post]="p"></app-post-card>
        } @empty {
          <p class="rounded-2xl border bg-white p-6 text-center text-gray-500">{{ emptyText }}</p>
        }
      </div>
    </div>
  `,
})
export class StatusListComponent implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);

  isSolved = this.route.snapshot.data['status'] === 'solved';
  title = this.isSolved ? '✓ সমাধান হয়েছে' : '🗑️ ডাস্টবিন';
  subtitle = this.isSolved
    ? 'যেসব পোস্টের কাজ হয়ে গেছে, সেগুলো এখানে থাকে।'
    : '১০ দিনেও সমাধান হয়নি — এমন পোস্ট এখানে চলে আসে। এগুলো ফিডে দেখা যায় না।';
  emptyText = this.isSolved ? 'এখনো কোনো সমাধান হওয়া পোস্ট নেই।' : 'ডাস্টবিন খালি।';
  posts$ = this.isSolved
    ? this.store.select(selectSolvedPosts)
    : this.store.select(selectDustbinPosts);

  ngOnInit(): void {
    this.store.dispatch(
      PostsActions.loadPosts({ filters: { status: this.isSolved ? 'solved' : 'dustbin' } }),
    );
  }
}
