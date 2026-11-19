import { createReducer, on } from '@ngrx/store';
import { AdminStats, PinRequest, Post, ReportItem, User } from '../../core/models';
import * as A from './admin.actions';

export interface AdminState {
  stats: AdminStats | null;
  users: User[];
  posts: Post[];
  pins: PinRequest[];
  reports: ReportItem[];
  loading: boolean;
  error: string | null;
}

export const initialAdminState: AdminState = {
  stats: null,
  users: [],
  posts: [],
  pins: [],
  reports: [],
  loading: false,
  error: null,
};

export const adminReducer = createReducer(
  initialAdminState,
  on(A.loadAdminData, (s) => ({ ...s, loading: true, error: null })),
  on(A.loadAdminDataSuccess, (s, { stats, users, posts, pins, reports }) => ({
    ...s, stats, users, posts, pins, reports, loading: false,
  })),
  on(A.loadAdminDataFailure, A.adminActionFailure, (s, { error }) => ({ ...s, loading: false, error })),
  on(A.approvePinSuccess, (s, { id }) => ({
    ...s,
    pins: s.pins.map((p) => (p.id === id ? { ...p, status: 'approved' as const } : p)),
  })),
  on(A.rejectPinSuccess, (s, { id }) => ({
    ...s,
    pins: s.pins.map((p) => (p.id === id ? { ...p, status: 'rejected' as const } : p)),
  })),
  on(A.resolveReportSuccess, (s, { id }) => ({
    ...s,
    reports: s.reports.map((r) => (r.id === id ? { ...r, status: 'resolved' as const } : r)),
  })),
  on(A.adminDeletePostSuccess, (s, { id }) => ({
    ...s, posts: s.posts.filter((p) => p.id !== id),
  })),
);
