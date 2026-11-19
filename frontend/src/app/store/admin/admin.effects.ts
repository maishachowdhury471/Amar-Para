import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import * as A from './admin.actions';

@Injectable()
export class AdminEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);

  loadAll$ = createEffect(() =>
    this.actions$.pipe(
      ofType(A.loadAdminData),
      switchMap(() =>
        forkJoin({
          stats: this.api.getAdminStats(),
          users: this.api.getAdminUsers(),
          posts: this.api.getAdminPosts(),
          pins: this.api.getAdminPins(),
          reports: this.api.getAdminReports(),
        }).pipe(
          map((d) => A.loadAdminDataSuccess(d)),
          catchError(() => of(A.loadAdminDataFailure({ error: 'অ্যাডমিন তথ্য আনা যায়নি।' }))),
        ),
      ),
    ),
  );

  approvePin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(A.approvePin),
      switchMap(({ id }) =>
        this.api.approvePin(id).pipe(
          map(() => A.approvePinSuccess({ id })),
          catchError(() => of(A.adminActionFailure({ error: 'পিন অনুমোদন দেওয়া যায়নি।' }))),
        ),
      ),
    ),
  );

  rejectPin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(A.rejectPin),
      switchMap(({ id }) =>
        this.api.rejectPin(id).pipe(
          map(() => A.rejectPinSuccess({ id })),
          catchError(() => of(A.adminActionFailure({ error: 'পিন বাতিল করা যায়নি।' }))),
        ),
      ),
    ),
  );

  resolveReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(A.resolveReport),
      switchMap(({ id }) =>
        this.api.resolveReport(id).pipe(
          map(() => A.resolveReportSuccess({ id })),
          catchError(() => of(A.adminActionFailure({ error: 'রিপোর্ট নিষ্পত্তি করা যায়নি।' }))),
        ),
      ),
    ),
  );

  deletePost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(A.adminDeletePost),
      switchMap(({ id }) =>
        this.api.adminDeletePost(id).pipe(
          map(() => A.adminDeletePostSuccess({ id })),
          catchError(() => of(A.adminActionFailure({ error: 'পোস্ট মোছা যায়নি।' }))),
        ),
      ),
    ),
  );
}
