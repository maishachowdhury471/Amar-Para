// আমার পাড়া — প্রোডাকশন পরিবেশ
export const environment = {
  production: true,
  // প্রোডাকশনে API কল আপেক্ষিক পথে যায় (/api/v1) — Netlify সেটিকে
  // ব্যাকএন্ডের আসল ঠিকানায় প্রক্সি করে (public/_redirects দেখুন)।
  apiUrl: '/api/v1',
  devShowOtp: false,
};
