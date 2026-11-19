import { createReducer, on } from '@ngrx/store';
import { User } from '../../core/models';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  otpVerified: boolean;
  devOtp: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('amarpara_token') : null,
  loading: false,
  error: null,
  otpSent: false,
  otpVerified: false,
  devOtp: null,
};

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.login, AuthActions.register, AuthActions.loadMe, AuthActions.requestOtp, AuthActions.verifyOtp,
    (s) => ({ ...s, loading: true, error: null })),
  on(AuthActions.loginSuccess, AuthActions.registerSuccess, (s, { user, token }) => ({
    ...s, user, token, loading: false, error: null,
  })),
  on(AuthActions.loginFailure, AuthActions.registerFailure, AuthActions.loadMeFailure,
    AuthActions.requestOtpFailure, AuthActions.verifyOtpFailure,
    (s, { error }) => ({ ...s, loading: false, error })),
  on(AuthActions.requestOtpSuccess, (s, { devOtp }) => ({
    ...s, loading: false, otpSent: true, devOtp: devOtp ?? null,
  })),
  on(AuthActions.verifyOtpSuccess, (s) => ({ ...s, loading: false, otpVerified: true })),
  on(AuthActions.loadMeSuccess, (s, { user }) => ({ ...s, user, loading: false })),
  on(AuthActions.logout, () => ({ ...initialAuthState, token: null })),
);
