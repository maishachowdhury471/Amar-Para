import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  selectAuthError,
  selectAuthLoading,
  selectDevOtp,
  selectIsLoggedIn,
  selectOtpSent,
  selectOtpVerified,
} from '../../store/auth/auth.selectors';
import * as AuthActions from '../../store/auth/auth.actions';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-md px-4 py-10">
      <div class="rounded-2xl border bg-white p-6 shadow">
        <h1 class="text-center text-2xl font-extrabold text-emerald-700">নতুন অ্যাকাউন্ট</h1>
        <p class="mt-1 text-center text-sm text-gray-600">
          @if (step === 1) { প্রথমে মোবাইল নম্বর যাচাই করুন }
          @else if (step === 2) { মোবাইলে পাঠানো OTP দিন }
          @else { আপনার তথ্য দিন }
        </p>

        <!-- ধাপ ১: মোবাইল -->
        @if (step === 1) {
          <form [formGroup]="phoneForm" (ngSubmit)="sendOtp()" class="mt-6 space-y-4">
            <div>
              <label class="mb-1 block text-sm font-bold">মোবাইল নম্বর</label>
              <input formControlName="phone" type="tel" placeholder="01XXXXXXXXX"
                class="w-full rounded-xl border px-4 py-3 text-base" />
              <p class="mt-1 text-xs text-gray-500">এই নম্বরে OTP পাঠানো হবে। যাচাই করা মোবাইল ছাড়া ঢোকা যাবে না।</p>
            </div>
            @if (error$ | async; as err) {
              <p class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ err }}</p>
            }
            <button type="submit" [disabled]="phoneForm.invalid || (loading$ | async)"
              class="w-full rounded-xl bg-emerald-600 py-3 text-lg font-bold text-white disabled:opacity-50">
              OTP পাঠান
            </button>
          </form>
        }

        <!-- ধাপ ২: OTP -->
        @if (step === 2) {
          <form [formGroup]="otpForm" (ngSubmit)="checkOtp()" class="mt-6 space-y-4">
            <div>
              <label class="mb-1 block text-sm font-bold">OTP (৬ সংখ্যা)</label>
              <input formControlName="otp" type="text" inputmode="numeric" maxlength="6" placeholder="••••••"
                class="w-full rounded-xl border px-4 py-3 text-center text-2xl tracking-widest" />
            </div>
            @if (environment.devShowOtp && (devOtp$ | async); as otp) {
              <p class="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                ⚠️ ডেভ মোড: OTP হলো <span class="text-lg tracking-widest">{{ otp }}</span>
                (আসল SMS চালু হলে এই নোট থাকবে না।)
              </p>
            }
            @if (error$ | async; as err) {
              <p class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ err }}</p>
            }
            <button type="submit" [disabled]="otpForm.invalid || (loading$ | async)"
              class="w-full rounded-xl bg-emerald-600 py-3 text-lg font-bold text-white disabled:opacity-50">
              যাচাই করুন
            </button>
            <button type="button" (click)="step = 1" class="w-full text-sm font-semibold text-emerald-700">
              ← নম্বর বদলান
            </button>
          </form>
        }

        <!-- ধাপ ৩: তথ্য -->
        @if (step === 3) {
          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 space-y-4">
            <div>
              <label class="mb-1 block text-sm font-bold">ইউজারনেম (অনন্য হতে হবে)</label>
              <input formControlName="username" type="text" placeholder="যেমন: rahim123"
                class="w-full rounded-xl border px-4 py-3 text-base" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-bold">গ্রামের নাম</label>
              <input formControlName="gram_name" type="text" placeholder="আপনার গ্রামের নাম"
                class="w-full rounded-xl border px-4 py-3 text-base" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-bold">পাড়ার নাম</label>
              <input formControlName="para_name" type="text" placeholder="আপনার পাড়ার নাম"
                class="w-full rounded-xl border px-4 py-3 text-base" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-bold">পাসওয়ার্ড</label>
              <input formControlName="password" type="password" placeholder="কমপক্ষে ৬ অক্ষর"
                class="w-full rounded-xl border px-4 py-3 text-base" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-bold">পাসওয়ার্ড আবার দিন</label>
              <input formControlName="confirmPassword" type="password" placeholder="পাসওয়ার্ড আবার"
                class="w-full rounded-xl border px-4 py-3 text-base" />
              @if (form.errors?.['mismatch'] && form.get('confirmPassword')?.touched) {
                <p class="mt-1 text-sm font-semibold text-red-600">দুটি পাসওয়ার্ড মিলছে না।</p>
              }
            </div>
            @if (error$ | async; as err) {
              <p class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ err }}</p>
            }
            <button type="submit" [disabled]="form.invalid || (loading$ | async)"
              class="w-full rounded-xl bg-emerald-600 py-3 text-lg font-bold text-white disabled:opacity-50">
              অ্যাকাউন্ট খুলুন
            </button>
          </form>
        }

        <p class="mt-4 text-center text-sm">
          অ্যাকাউন্ট আছে? <a routerLink="/login" class="font-bold text-emerald-700 underline">লগইন করুন</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  protected readonly environment = environment;

  step = 1;
  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);
  devOtp$ = this.store.select(selectDevOtp);

  phoneForm = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^01[3-9]\d{8}$/)]],
  });
  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });
  form = this.fb.group(
    {
      username: ['', [Validators.required, Validators.minLength(3)]],
      gram_name: ['', Validators.required],
      para_name: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: (g) => (g.get('password')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true }) },
  );

  constructor() {
    this.store
      .select(selectOtpSent)
      .pipe(filter(Boolean))
      .subscribe(() => (this.step = 2));
    this.store
      .select(selectOtpVerified)
      .pipe(filter(Boolean))
      .subscribe(() => (this.step = 3));
    this.store
      .select(selectIsLoggedIn)
      .pipe(filter(Boolean))
      .subscribe(() => this.router.navigate(['/feed']));
  }

  sendOtp(): void {
    if (this.phoneForm.invalid) return;
    this.store.dispatch(AuthActions.requestOtp({ phone: this.phoneForm.value.phone! }));
  }

  checkOtp(): void {
    if (this.otpForm.invalid) return;
    this.store.dispatch(
      AuthActions.verifyOtp({ phone: this.phoneForm.value.phone!, otp: this.otpForm.value.otp! }),
    );
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.store.dispatch(
      AuthActions.register({
        username: v.username!,
        gram_name: v.gram_name!,
        para_name: v.para_name!,
        phone: this.phoneForm.value.phone!,
        password: v.password!,
        confirmPassword: v.confirmPassword!,
        otp: this.otpForm.value.otp!,
      }),
    );
  }
}
