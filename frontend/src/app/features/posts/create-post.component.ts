import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs';
import { CATEGORIES } from '../../core/models';
import { selectCreatedPost, selectCreating, selectPostsError } from '../../store/posts/posts.selectors';
import * as PostsActions from '../../store/posts/posts.actions';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-2xl px-3 py-4">
      <div class="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
        <h1 class="text-2xl font-extrabold">{{ editId ? 'পোস্ট এডিট করুন' : 'নতুন পোস্ট দিন' }}</h1>
        <p class="mt-1 text-sm text-gray-600">
          দিনে সর্বোচ্চ <strong>২টি</strong> পোস্ট করা যাবে।
          @if ((user$ | async)?.posts_today !== undefined) {
            আজ আপনি <strong>{{ (user$ | async)?.posts_today }}টি</strong> পোস্ট করেছেন।
          }
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-4 space-y-4">
          <div>
            <label class="mb-1 block text-sm font-bold">শিরোনাম</label>
            <input formControlName="title" type="text" placeholder="যেমন: ভালো মিস্ত্রি দরকার"
              class="w-full rounded-xl border px-4 py-3 text-base" />
          </div>

          <div>
            <label class="mb-1 block text-sm font-bold">বিস্তারিত লিখুন</label>
            <textarea formControlName="body" rows="5" placeholder="যা জানাতে চান, সহজ ভাষায় লিখুন…"
              class="w-full rounded-xl border px-4 py-3 text-base"></textarea>
          </div>

          <div>
            <label class="mb-1 block text-sm font-bold">ক্যাটাগরি</label>
            <div class="flex flex-wrap gap-2">
              @for (c of categories; track c.key) {
                <button type="button" (click)="form.patchValue({ category: c.key })"
                  [class.bg-emerald-600]="form.value.category === c.key"
                  [class.text-white]="form.value.category === c.key"
                  class="rounded-full border px-3 py-2 text-sm font-semibold">{{ c.label }}</button>
              }
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-bold">ছবি (যদি থাকে)</label>
            <input type="file" accept="image/*" multiple (change)="onFiles($event)"
              class="w-full rounded-xl border px-4 py-3 text-sm" />
            @if (previews.length) {
              <div class="mt-2 grid grid-cols-3 gap-2">
                @for (src of previews; track src) {
                  <img [src]="src" alt="ছবির প্রিভিউ" class="h-24 w-full rounded-xl object-cover" />
                }
              </div>
            }
          </div>

          @if (error$ | async; as err) {
            <p class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ err }}</p>
          }

          <button type="submit" [disabled]="form.invalid || (creating$ | async)"
            class="w-full rounded-xl bg-emerald-600 py-3 text-lg font-bold text-white disabled:opacity-50">
            {{ (creating$ | async) ? 'পোস্ট হচ্ছে…' : editId ? 'সেভ করুন' : 'পোস্ট করুন' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class CreatePostComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  categories = CATEGORIES;
  editId: number | null = null;
  previews: string[] = [];
  private files: File[] = [];

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    body: ['', [Validators.required, Validators.minLength(5)]],
    category: ['need', Validators.required],
  });
  creating$ = this.store.select(selectCreating);
  error$ = this.store.select(selectPostsError);
  user$ = this.store.select(selectCurrentUser);

  constructor() {
    this.store
      .select(selectCreatedPost)
      .pipe(filter((p) => !!p))
      .subscribe((p) => {
        this.store.dispatch(PostsActions.clearCreateState());
        this.router.navigate(['/post', p!.id]);
      });
  }

  ngOnInit(): void {
    const edit = this.route.snapshot.queryParamMap.get('edit');
    if (edit) {
      this.editId = Number(edit);
      this.api.getPost(this.editId).subscribe((p) => {
        this.form.patchValue({ title: p.title, body: p.body, category: p.category });
        this.previews = p.photos ?? [];
      });
    }
  }

  onFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.files = Array.from(input.files ?? []);
    this.previews = [];
    for (const f of this.files) {
      const reader = new FileReader();
      reader.onload = () => this.previews.push(reader.result as string);
      reader.readAsDataURL(f);
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const fd = new FormData();
    fd.append('title', v.title!);
    fd.append('body', v.body!);
    fd.append('category', v.category!);
    for (const f of this.files) fd.append('photos', f);
    if (this.editId) {
      this.store.dispatch(PostsActions.updatePost({ id: this.editId, form: fd }));
      this.router.navigate(['/post', this.editId]);
    } else {
      this.store.dispatch(PostsActions.createPost({ form: fd }));
    }
  }
}
