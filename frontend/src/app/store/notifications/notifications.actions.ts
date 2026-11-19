import { createAction, props } from '@ngrx/store';
import { AppNotification } from '../../core/models';

export const loadNotifications = createAction('[Notifications] Load');
export const loadNotificationsSuccess = createAction(
  '[Notifications] Load Success',
  props<{ notifications: AppNotification[] }>(),
);
export const loadNotificationsFailure = createAction(
  '[Notifications] Load Failure',
  props<{ error: string }>(),
);
export const markRead = createAction('[Notifications] Mark Read', props<{ id: number }>());
export const markReadSuccess = createAction('[Notifications] Mark Read Success', props<{ id: number }>());
export const markAllRead = createAction('[Notifications] Mark All Read');
export const markAllReadSuccess = createAction('[Notifications] Mark All Read Success');
