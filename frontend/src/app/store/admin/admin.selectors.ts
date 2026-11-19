import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AdminState } from './admin.reducer';

export const selectAdminState = createFeatureSelector<AdminState>('admin');
export const selectAdminStats = createSelector(selectAdminState, (s) => s.stats);
export const selectAdminUsers = createSelector(selectAdminState, (s) => s.users);
export const selectAdminPosts = createSelector(selectAdminState, (s) => s.posts);
export const selectPendingPins = createSelector(selectAdminState, (s) =>
  s.pins.filter((p) => p.status === 'pending'),
);
export const selectAllPins = createSelector(selectAdminState, (s) => s.pins);
export const selectPendingReports = createSelector(selectAdminState, (s) =>
  s.reports.filter((r) => r.status === 'pending'),
);
export const selectAllReports = createSelector(selectAdminState, (s) => s.reports);
export const selectAdminLoading = createSelector(selectAdminState, (s) => s.loading);
export const selectAdminError = createSelector(selectAdminState, (s) => s.error);
