import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AdInfo } from '../../core/models';

@Component({
  selector: 'app-ads',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-2xl px-3 py-4">
      <div class="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 class="text-2xl font-extrabold">📢 বিজ্ঞাপন কীভাবে দেবেন</h1>

        @if (info) {
          <div class="mt-4 space-y-3 text-base leading-relaxed">
            <p class="rounded-xl bg-yellow-50 p-4">
              📌 <strong>পিন করা পোস্ট:</strong> {{ info.pin_price_taka }} টাকা / {{ info.pin_days }} দিন।
              পিন করা পোস্ট ফিডের একদম উপরে থাকে, সবাই আগে দেখে।
            </p>
            <p class="rounded-xl bg-gray-50 p-4">
              ⏱️ <strong>মেয়াদ বাড়ানো:</strong> {{ info.extend_price_taka }} টাকায় আরও {{ info.extend_days }} দিন।
            </p>
            <p class="whitespace-pre-line">{{ info.how_to }}</p>
          </div>
        } @else {
          <div class="mt-4 space-y-3 text-base leading-relaxed">
            <p class="rounded-xl bg-yellow-50 p-4">
              📌 <strong>পিন করা পোস্ট:</strong> ১০০ টাকা / ১০ দিন।
              পিন করা পোস্ট ফিডের একদম উপরে থাকে, সবাই আগে দেখে।
            </p>
            <p class="rounded-xl bg-gray-50 p-4">
              ⏱️ <strong>মেয়াদ বাড়ানো:</strong> ১০০ টাকায় আরও ৫ দিন।
            </p>
            <p>
              বিজ্ঞাপন দিতে নিচের ফর্মটি পূরণ করুন, অথবা আপনার পোস্ট থেকে
              "পিন চাই" বোতামে চাপ দিন। অ্যাডমিন অনুমোদন দিলে পোস্টটি উপরে থাকবে।
              টাকা অ্যাডমিনকে দিতে হবে।
            </p>
          </div>
        }

        <h2 class="mt-6 text-lg font-bold">বিজ্ঞাপনের আবেদন</h2>
        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-3 space-y-4">
          <div>
            <label class="mb-1 block text-sm font-bold">আপনার নাম</label>
            <input formControlName="name" type="text" class="w-full rounded-xl border px-4 py-3 text-base" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-bold">মোবাইল নম্বর</label>
            <input formControlName="phone" type="tel" class="w-full rounded-xl border px-4 py-3 text-base" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-bold">কী বিজ্ঞাপন দিতে চান?</label>
            <textarea formControlName="message" rows="4" class="w-full rounded-xl border px-4 py-3 text-base"></textarea>
          </div>
          @if (sent) {
            <p class="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              আবেদন পাঠানো হয়েছে। অ্যাডমিন আপনার সঙ্গে যোগাযোগ করবেন।
            </p>
          }
          @if (error) {
            <p class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ error }}</p>
          }
          <button type="submit" [disabled]="form.invalid"
            class="w-full rounded-xl bg-emerald-600 py-3 text-lg font-bold text-white disabled:opacity-50">
            আবেদন পাঠান
          </button>
        </form>
      </div>
    </div>
  `,
})
export class AdsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  info: AdInfo | null = null;
  sent = false;
  error: string | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^01[3-9]\d{8}$/)]],
    message: ['', [Validators.required, Validators.minLength(5)]],
  });

  ngOnInit(): void {
    this.api.getAdsInfo().subscribe({
      next: (info) => (this.info = info),
      error: () => (this.info = null), // সার্ভার না থাকলে ডিফল্ট তথ্য দেখাবে
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.api.requestAd({ name: v.name!, phone: v.phone!, message: v.message! }).subscribe({
      next: () => {
        this.sent = true;
        this.error = null;
        this.form.reset();
      },
      error: () => (this.error = 'আবেদন পাঠানো যায়নি। আবার চেষ্টা করুন।'),
    });
  }
}
