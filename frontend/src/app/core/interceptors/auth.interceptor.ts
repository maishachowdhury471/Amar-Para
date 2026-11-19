import { HttpInterceptorFn } from '@angular/common/http';

/** JWT Bearer টোকেন localStorage থেকে নিয়ে প্রতিটি API কলে যোগ করে। */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('amarpara_token');
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
