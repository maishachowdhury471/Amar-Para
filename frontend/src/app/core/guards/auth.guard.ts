import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectCurrentUser } from '../../store/auth/auth.selectors';

/**
 * লগইন ছাড়া ঢোকা যাবে না — যাচাই করা মোবাইল ছাড়া ফিড দেখা যাবে না।
 * টোকেন থাকলেই ঢুকতে দেওয়া হয়; AppComponent চালু হতেই loadMe() দিয়ে
 * নিজের তথ্য এনে নেয় (পাতা রিফ্রেশের পর ইউজার লোড হওয়ার আগেই গার্ড
 * যেন লগইনে না পাঠায়, তাই শুধু টোকেন দেখা হয়)।
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return localStorage.getItem('amarpara_token')
    ? true
    : router.createUrlTree(['/login']);
};

/**
 * শুধু অ্যাডমিন দেখবে — অন্যরা গেলে ফিডে পাঠানো হবে।
 * ইউজার এখনো লোড না হলে (রিফ্রেশের পর) ঢুকতে দেওয়া হয়; অ্যাডমিন
 * API 403 দিলে ড্যাশবোর্ড খালি দেখাবে, আর লগইন করা সাধারণ
 * ব্যবহারকারী লোড হওয়ার পর is_admin=false হলে ফিডে পাঠানো হবে।
 */
export const adminGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);
  if (!localStorage.getItem('amarpara_token')) {
    return router.createUrlTree(['/login']);
  }
  return store.select(selectCurrentUser).pipe(
    take(1),
    map((user) => (user === null || user.is_admin ? true : router.createUrlTree(['/feed']))),
  );
};
