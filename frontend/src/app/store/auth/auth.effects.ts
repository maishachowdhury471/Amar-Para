import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import * as AuthActions from './auth.actions';

function friendlyError(err: unknown): string {
  const e = err as {
    error?: { detail?: unknown; message?: string };
    status?: number;
  };
  if (e?.status === 429)
    return 'আজকের সীমা শেষ — দিনে ২টির বেশি পোস্ট করা যাবে না। আগামীকাল আবার চেষ্টা করুন।';
  const d = e?.error?.detail;
  if (typeof d === 'string') return d;
  // FastAPI-র ৪২২ ভুলে detail একটি তালিকা হয় — সেটি সরাসরি দেখালে
  // পাতায় "[object Object]" লেখা আসে। প্রথম ভুলটির বার্তা নেওয়া হয়।
  if (Array.isArray(d) && d.length > 0) {
    const first = d[0] as { msg?: string; message?: string; loc?: unknown[] };
    const msg =
      typeof first === 'string'
        ? first
        : (first?.msg ?? first?.message ?? 'তথ্য ঠিক নেই। আবার দেখুন।');
    const field = Array.isArray(first?.loc) ? String(first.loc[first.loc.length - 1]) : '';
    return field ? `${field}: ${msg}` : msg;
  }
  if (d && typeof d === 'object') {
    const o = d as { message?: string; msg?: string };
    if (o.message ?? o.msg) return o.message ?? o.msg ?? '';
  }
  return e?.error?.message ?? 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।';
}

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ username, password }) =>
        this.api.login(username, password).pipe(
          tap((res) => localStorage.setItem('amarpara_token', res.access_token)),
          map((res) => AuthActions.loginSuccess({ user: res.user, token: res.access_token })),
          catchError((err) => of(AuthActions.loginFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap((payload) =>
        this.api.register(payload).pipe(
          tap((res) => localStorage.setItem('amarpara_token', res.access_token)),
          map((res) => AuthActions.registerSuccess({ user: res.user, token: res.access_token })),
          catchError((err) => of(AuthActions.registerFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  requestOtp$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.requestOtp),
      switchMap(({ phone }) =>
        this.api.requestOtp(phone).pipe(
          map((res) => AuthActions.requestOtpSuccess({ devOtp: res.dev_otp })),
          catchError((err) => of(AuthActions.requestOtpFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  verifyOtp$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.verifyOtp),
      switchMap(({ phone, otp }) =>
        this.api.verifyOtp(phone, otp).pipe(
          map(() => AuthActions.verifyOtpSuccess()),
          catchError((err) => of(AuthActions.verifyOtpFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  loadMe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadMe),
      switchMap(() =>
        this.api.getMe().pipe(
          map((user) => AuthActions.loadMeSuccess({ user })),
          catchError((err) => of(AuthActions.loadMeFailure({ error: friendlyError(err) }))),
        ),
      ),
    ),
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => localStorage.removeItem('amarpara_token')),
      ),
    { dispatch: false },
  );
}
