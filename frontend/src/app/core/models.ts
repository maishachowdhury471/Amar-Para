// আমার পাড়া — ডেটা মডেল (ব্যাকএন্ড API চুক্তি অনুযায়ী)

export type CategoryKey =
  | 'need' // দরকার
  | 'sale' // বিক্রি
  | 'lost' // হারিয়ে গেছে
  | 'news' // খবর
  | 'shop' // দোকানের খবর
  | 'worker' // কাজের লোক
  | 'rent' // বাড়ি ভাড়া
  | 'venture'; // নতুন উদ্যোগ

export const CATEGORIES: { key: CategoryKey; label: string; color: string }[] = [
  { key: 'need', label: 'দরকার', color: 'bg-amber-100 text-amber-800' },
  { key: 'sale', label: 'বিক্রি', color: 'bg-emerald-100 text-emerald-800' },
  { key: 'lost', label: 'হারিয়ে গেছে', color: 'bg-rose-100 text-rose-800' },
  { key: 'news', label: 'খবর', color: 'bg-sky-100 text-sky-800' },
  { key: 'shop', label: 'দোকানের খবর', color: 'bg-violet-100 text-violet-800' },
  { key: 'worker', label: 'কাজের লোক', color: 'bg-orange-100 text-orange-800' },
  { key: 'rent', label: 'বাড়ি ভাড়া', color: 'bg-teal-100 text-teal-800' },
  { key: 'venture', label: 'নতুন উদ্যোগ', color: 'bg-indigo-100 text-indigo-800' },
];

export function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export function categoryColor(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.color ?? 'bg-gray-100 text-gray-800';
}

export type PostStatus = 'open' | 'solved' | 'dustbin';

export interface User {
  id: number;
  username: string;
  gram_name: string;
  para_name: string;
  phone: string;
  is_admin?: boolean;
  created_at?: string;
  posts_today?: number;
}

export interface Gram {
  id: number;
  name: string;
}

export interface Para {
  id: number;
  gram_id: number;
  name: string;
}

export interface Post {
  id: number;
  title: string;
  body: string;
  category: CategoryKey;
  status: PostStatus;
  is_pinned: boolean;
  pin_until?: string | null;
  photos?: string[];
  author_id: number;
  author_username: string;
  author_para?: string;
  gram_id?: number | null;
  para_id?: number | null;
  gram_name?: string;
  para_name?: string;
  phone?: string;
  created_at: string;
  solved_at?: string | null;
  comments_count?: number;
  flags_count?: number;
}

export interface PostComment {
  id: number;
  post_id: number;
  author_id: number;
  author_username: string;
  body: string;
  created_at: string;
  flags_count?: number;
}

export interface AppNotification {
  id: number;
  title: string;
  body: string;
  post_id?: number | null;
  is_read: boolean;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_posts: number;
  total_comments: number;
  open_posts: number;
  solved_posts: number;
  dustbin_posts: number;
  pending_pins: number;
  pending_reports: number;
  /** দৈনিক/সাপ্তাহিক/মাসিক বৃদ্ধি — [{label, users, posts}] */
  growth: { label: string; users: number; posts: number }[];
  posts_by_category: { category: string; count: number }[];
}

export interface PinRequest {
  id: number;
  post_id: number;
  post_title: string;
  username: string;
  days: number;
  amount_taka: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface ReportItem {
  id: number;
  post_id: number;
  post_title: string;
  reporter_username: string;
  reason: string;
  status: 'pending' | 'resolved';
  created_at: string;
}

export interface AdInfo {
  pin_price_taka: number;
  pin_days: number;
  extend_days: number;
  extend_price_taka: number;
  how_to: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
