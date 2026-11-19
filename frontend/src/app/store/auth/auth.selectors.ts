import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');
export const selectCurrentUser = createSelector(selectAuthState, (s) => s.user);
export const selectIsLoggedIn = createSelector(
  selectAuthState,
  (s) => !!s.token && !!s.user,
);
export const selectAuthLoading = createSelector(selectAuthState, (s) => s.loading);
export const selectAuthError = createSelector(selectAuthState, (s) => s.error);
export const selectOtpSent = createSelector(selectAuthState, (s) => s.otpSent);
export const selectOtpVerified = createSelector(selectAuthState, (s) => s.otpVerified);
export const selectDevOtp = createSelector(selectAuthState, (s) => s.devOtp);
export const selectIsAdmin = createSelector(selectAuthState, (s) => !!s.user?.is_admin);
