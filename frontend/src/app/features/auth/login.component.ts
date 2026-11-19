import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs';
import { selectAuthError, selectAuthLoading, selectIsLoggedIn } from '../../store/auth/auth.selectors';
import * as AuthActions from '../../store/auth/auth.actions';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-md px-4 py-10">
      <div class="rounded-2xl border bg-white p-6 shadow">
        <h1 class="text-center text-2xl font-extrabold text-emerald-700">🏡 আমার পাড়া</h1>
        <p class="mt-1 text-center text-sm text-gray-600">আপনার গ্রামের নোটিশ বোর্ডে ঢুকুন</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 space-y-4">
          <div>
            <label class="mb-1 block text-sm font-bold">ইউজারনেম</label>
            <input formControlName="username" type="text" placeholder="আপনার ইউজারনেম"
              class="w-full rounded-xl border px-4 py-3 text-base" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-bold">পাসওয়ার্ড</label>
            <input formControlName="password" type="password" placeholder="পাসওয়ার্ড"
              class="w-full rounded-xl border px-4 py-3 text-base" />
          </div>

          @if (error$ | async; as err) {
            <p class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ err }}</p>
          }

          <button type="submit" [disabled]="form.invalid || (loading$ | async)"
            class="w-full rounded-xl bg-emerald-600 py-3 text-lg font-bold text-white disabled:opacity-50">
            {{ (loading$ | async) ? 'ঢুকছি…' : 'লগইন করুন' }}
          </button>
        </form>

        <p class="mt-4 text-center text-sm">
          নতুন? <a routerLink="/register" class="font-bold text-emerald-700 underline">অ্যাকাউন্ট খুলুন</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  constructor() {
    this.store
      .select(selectIsLoggedIn)
      .pipe(filter(Boolean))
      .subscribe(() => this.router.navigate(['/feed']));
  }

  submit(): void {
    if (this.form.invalid) return;
    const { username, password } = this.form.value;
    this.store.dispatch(AuthActions.login({ username: username!, password: password! }));
  }
}
