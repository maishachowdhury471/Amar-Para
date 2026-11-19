import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import * as PostsActions from './posts.actions';

function friendlyError(err: unknown): string {
  const e = err as {
    error?: { detail?: unknown; message?: string };
    status?: number;
  };
  if (e?.status === 429)
    return 'দিনে ২টির বেশি পোস্ট করা যাবে না। আজকের সীমা শেষ — আগামীকাল আবার চেষ্টা করুন।';
  const d = e?.error?.detail;
  let detailText: string | undefined;
  if (typeof d === 'string') detailText = d;
  // FastAPI-র ৪২২ ভুলে detail একটি তালিকা হয় — সেটি সরাসরি দেখালে
  // পাতায় "[object Object]" লেখা আসে। প্রথম ভুলটির বার্তা নেওয়া হয়।
  else if (Array.isArray(d) && d.length > 0) {
    const first = d[0] as { msg?: string; message?: string; loc?: unknown[] };
    const msg =
      typeof first === 'string'
        ? first
        : (first?.msg ?? first?.message ?? 'তথ্য ঠিক নেই। আবার দেখুন।');
    const field = Array.isArray(first?.loc) ? String(first.loc[first.loc.length - 1]) : '';
    detailText = field ? `${field}: ${msg}` : msg;
  } else if (d && typeof d === 'object') {
    const o = d as { message?: string; msg?: string };
    detailText = o.message ?? o.msg;
  }
  if (e?.status === 400) return detailText ?? 'পোস্ট করা যায়নি। তথ্য ঠিক আছে কি না দেখুন।';
  return detailText ?? e?.error?.message ?? 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।';
}

@Injectable()
export class PostsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);

  loadPosts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.loadPosts),
      switchMap(({ filters }) =>
        this.api.getPosts(filters ?? {}).pipe(
          map((posts) => PostsActions.loadPostsSuccess({ posts })),
          catchError((err) => of(PostsActions.loadPostsFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  loadPost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.loadPost),
      switchMap(({ id }) =>
        this.api.getPost(id).pipe(
          map((post) => PostsActions.loadPostSuccess({ post })),
          catchError((err) => of(PostsActions.loadPostFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  createPost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.createPost),
      switchMap(({ form }) =>
        this.api.createPost(form).pipe(
          map((post) => PostsActions.createPostSuccess({ post })),
          catchError((err) => of(PostsActions.createPostFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  updatePost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.updatePost),
      switchMap(({ id, form }) =>
        this.api.updatePost(id, form).pipe(
          map((post) => PostsActions.updatePostSuccess({ post })),
          catchError((err) => of(PostsActions.updatePostFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  deletePost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.deletePost),
      switchMap(({ id }) =>
        this.api.deletePost(id).pipe(
          map(() => PostsActions.deletePostSuccess({ id })),
          catchError((err) => of(PostsActions.deletePostFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  markSolved$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.markSolved),
      switchMap(({ id }) =>
        this.api.markSolved(id).pipe(
          map((post) => PostsActions.markSolvedSuccess({ post })),
          catchError((err) => of(PostsActions.markSolvedFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  requestPin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.requestPin),
      switchMap(({ id }) =>
        this.api.requestPin(id).pipe(
          map((res) => PostsActions.requestPinSuccess({ message: res.message || 'পিনের আবেদন পাঠানো হয়েছে। অ্যাডমিন অনুমোদন দিলে পোস্টটি উপরে থাকবে।' })),
          catchError((err) => of(PostsActions.requestPinFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  extendPin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.extendPin),
      switchMap(({ id }) =>
        this.api.extendPin(id).pipe(
          map((res) => PostsActions.extendPinSuccess({ message: res.message || 'পিনের মেয়াদ ৫ দিন বাড়ানোর আবেদন পাঠানো হয়েছে।' })),
          catchError((err) => of(PostsActions.extendPinFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  reportPost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.reportPost),
      switchMap(({ id, reason }) =>
        this.api.reportPost(id, reason).pipe(
          map((res) => PostsActions.reportPostSuccess({ message: res.message || 'রিপোর্ট পাঠানো হয়েছে। অ্যাডমিন দেখবেন।' })),
          catchError((err) => of(PostsActions.reportPostFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  loadComments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.loadComments),
      switchMap(({ postId }) =>
        this.api.getComments(postId).pipe(
          map((comments) => PostsActions.loadCommentsSuccess({ comments })),
          catchError((err) => of(PostsActions.loadCommentsFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  addComment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.addComment),
      switchMap(({ postId, body }) =>
        this.api.addComment(postId, body).pipe(
          map((comment) => PostsActions.addCommentSuccess({ comment })),
          catchError((err) => of(PostsActions.addCommentFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  flagComment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.flagComment),
      switchMap(({ id }) =>
        this.api.flagComment(id).pipe(
          map(() => PostsActions.flagCommentSuccess({ id })),
          catchError((err) => of(PostsActions.flagCommentFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );
}
