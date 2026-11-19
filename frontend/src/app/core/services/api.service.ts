import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdInfo,
  AdminStats,
  AppNotification,
  AuthResponse,
  Gram,
  Para,
  PinRequest,
  Post,
  PostComment,
  ReportItem,
  User,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ---------- Auth ----------
  requestOtp(phone: string): Observable<{ dev_otp?: string; message: string }> {
    // ব্যাকএন্ড mobile নামে ফিল্ড চায় (phone নয়) — নাম না মিললে ৪২২ ভুল আসে।
    return this.http.post<{ dev_otp?: string; message: string }>(
      `${this.base}/auth/request-otp`,
      { mobile: phone },
    );
  }

  verifyOtp(phone: string, otp: string): Observable<{ verified: boolean; message: string }> {
    return this.http.post<{ verified: boolean; message: string }>(
      `${this.base}/auth/verify-otp`,
      { mobile: phone, otp },
    );
  }

  register(payload: {
    username: string;
    gram_name: string;
    para_name: string;
    phone: string;
    password: string;
    confirmPassword: string;
    otp: string;
  }): Observable<AuthResponse> {
    // ব্যাকএন্ড mobile, confirm_password ও otp ফিল্ড চায় — এগুলো ছাড়া ৪২২ ভুল আসে।
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, {
      username: payload.username,
      gram_name: payload.gram_name,
      para_name: payload.para_name,
      mobile: payload.phone,
      password: payload.password,
      confirm_password: payload.confirmPassword,
      otp: payload.otp,
    });
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, { username, password });
  }

  // ---------- Users ----------
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.base}/users/me`);
  }

  getUserByUsername(username: string): Observable<User> {
    return this.http.get<User>(`${this.base}/users/${username}`);
  }

  getUserPosts(id: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.base}/users/${id}/posts`);
  }

  // ---------- Grams / Paras ----------
  getGrams(): Observable<Gram[]> {
    return this.http.get<Gram[]>(`${this.base}/grams`);
  }

  getParas(gramId: number): Observable<Para[]> {
    return this.http.get<Para[]>(`${this.base}/grams/${gramId}/paras`);
  }

  // ---------- Posts ----------
  getPosts(filters: {
    category?: string;
    gram_id?: number;
    para_id?: number;
    q?: string;
    status?: string;
  } = {}): Observable<Post[]> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<Post[]>(`${this.base}/posts`, { params });
  }

  getPost(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.base}/posts/${id}`);
  }

  createPost(form: FormData): Observable<Post> {
    return this.http.post<Post>(`${this.base}/posts`, form);
  }

  updatePost(id: number, form: FormData): Observable<Post> {
    return this.http.put<Post>(`${this.base}/posts/${id}`, form);
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/posts/${id}`);
  }

  markSolved(id: number): Observable<Post> {
    return this.http.post<Post>(`${this.base}/posts/${id}/mark-solved`, {});
  }

  requestPin(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/posts/${id}/request-pin`, {});
  }

  extendPin(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/posts/${id}/extend-pin`, {});
  }

  reportPost(id: number, reason: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/posts/${id}/report`, { reason });
  }

  // ---------- Comments ----------
  getComments(postId: number): Observable<PostComment[]> {
    return this.http.get<PostComment[]>(`${this.base}/posts/${postId}/comments`);
  }

  addComment(postId: number, body: string): Observable<PostComment> {
    return this.http.post<PostComment>(`${this.base}/posts/${postId}/comments`, { body });
  }

  flagComment(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/comments/${id}/flag`, {});
  }

  // ---------- Notifications ----------
  getNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.base}/notifications`);
  }

  markNotificationRead(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<void> {
    return this.http.post<void>(`${this.base}/notifications/read-all`, {});
  }

  // ---------- Admin ----------
  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/admin/stats`);
  }

  getAdminUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/admin/users`);
  }

  getAdminPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.base}/admin/posts`);
  }

  getAdminPins(): Observable<PinRequest[]> {
    return this.http.get<PinRequest[]>(`${this.base}/admin/pins`);
  }

  approvePin(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/pins/${id}/approve`, {});
  }

  rejectPin(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/pins/${id}/reject`, {});
  }

  getAdminReports(): Observable<ReportItem[]> {
    return this.http.get<ReportItem[]>(`${this.base}/admin/reports`);
  }

  resolveReport(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/reports/${id}/resolve`, {});
  }

  adminDeletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/posts/${id}`);
  }

  // ---------- Ads ----------
  getAdsInfo(): Observable<AdInfo> {
    return this.http.get<AdInfo>(`${this.base}/ads/info`);
  }

  requestAd(payload: { name: string; phone: string; message: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/ads/requests`, payload);
  }
}
