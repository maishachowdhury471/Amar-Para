import { createFeatureSelector, createSelector } from '@ngrx/store';
import { NotificationsState } from './notifications.reducer';

export const selectNotificationsState = createFeatureSelector<NotificationsState>('notifications');
export const selectAllNotifications = createSelector(selectNotificationsState, (s) => s.list);
export const selectUnreadCount = createSelector(selectAllNotifications, (list) =>
  list.filter((n) => !n.is_read).length,
);
export const selectNotificationsLoading = createSelector(selectNotificationsState, (s) => s.loading);
