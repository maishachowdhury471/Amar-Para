import { createReducer, on } from '@ngrx/store';
import { AppNotification } from '../../core/models';
import * as N from './notifications.actions';

export interface NotificationsState {
  list: AppNotification[];
  loading: boolean;
  error: string | null;
}

export const initialNotificationsState: NotificationsState = { list: [], loading: false, error: null };

export const notificationsReducer = createReducer(
  initialNotificationsState,
  on(N.loadNotifications, (s) => ({ ...s, loading: true, error: null })),
  on(N.loadNotificationsSuccess, (s, { notifications }) => ({ ...s, list: notifications, loading: false })),
  on(N.loadNotificationsFailure, (s, { error }) => ({ ...s, loading: false, error })),
  on(N.markReadSuccess, (s, { id }) => ({
    ...s,
    list: s.list.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
  })),
  on(N.markAllReadSuccess, (s) => ({ ...s, list: s.list.map((n) => ({ ...n, is_read: true })) })),
);
