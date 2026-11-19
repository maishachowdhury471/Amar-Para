import { createAction, props } from '@ngrx/store';
import { User } from '../../core/models';

export const login = createAction('[Auth] Login', props<{ username: string; password: string }>());
export const loginSuccess = createAction('[Auth] Login Success', props<{ user: User; token: string }>());
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: string }>());

export const requestOtp = createAction('[Auth] Request OTP', props<{ phone: string }>());
export const requestOtpSuccess = createAction(
  '[Auth] Request OTP Success',
  props<{ devOtp?: string }>(),
);
export const requestOtpFailure = createAction('[Auth] Request OTP Failure', props<{ error: string }>());

export const verifyOtp = createAction('[Auth] Verify OTP', props<{ phone: string; otp: string }>());
export const verifyOtpSuccess = createAction('[Auth] Verify OTP Success');
export const verifyOtpFailure = createAction('[Auth] Verify OTP Failure', props<{ error: string }>());

export const register = createAction(
  '[Auth] Register',
  props<{
    username: string;
    gram_name: string;
    para_name: string;
    phone: string;
    password: string;
    confirmPassword: string;
    otp: string;
  }>(),
);
export const registerSuccess = createAction('[Auth] Register Success', props<{ user: User; token: string }>());
export const registerFailure = createAction('[Auth] Register Failure', props<{ error: string }>());

export const loadMe = createAction('[Auth] Load Me');
export const loadMeSuccess = createAction('[Auth] Load Me Success', props<{ user: User }>());
export const loadMeFailure = createAction('[Auth] Load Me Failure', props<{ error: string }>());

export const logout = createAction('[Auth] Logout');
