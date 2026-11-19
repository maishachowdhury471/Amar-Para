import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import * as N from './notifications.actions';

@Injectable()
export class NotificationsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(N.loadNotifications),
      switchMap(() =>
        this.api.getNotifications().pipe(
          map((notifications) => N.loadNotificationsSuccess({ notifications })),
          catchError(() =>
            of(N.loadNotificationsFailure({ error: 'নোটিফিকেশন আনা যায়নি।' })),
          ),
        ),
      ),
    ),
  );

  markRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(N.markRead),
      switchMap(({ id }) =>
        this.api.markNotificationRead(id).pipe(
          map(() => N.markReadSuccess({ id })),
          catchError(() => of(N.loadNotificationsFailure({ error: 'পড়া চিহ্ন দেওয়া যায়নি।' }))),
        ),
      ),
    ),
  );

  markAllRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(N.markAllRead),
      switchMap(() =>
        this.api.markAllNotificationsRead().pipe(
          map(() => N.markAllReadSuccess()),
          catchError(() => of(N.loadNotificationsFailure({ error: 'সব পড়া চিহ্ন দেওয়া যায়নি।' }))),
        ),
      ),
    ),
  );
}
