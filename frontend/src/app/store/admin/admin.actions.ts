import { createAction, props } from '@ngrx/store';
import { AdminStats, PinRequest, Post, ReportItem, User } from '../../core/models';

export const loadAdminData = createAction('[Admin] Load All');
export const loadAdminDataSuccess = createAction(
  '[Admin] Load All Success',
  props<{ stats: AdminStats; users: User[]; posts: Post[]; pins: PinRequest[]; reports: ReportItem[] }>(),
);
export const loadAdminDataFailure = createAction('[Admin] Load All Failure', props<{ error: string }>());

export const approvePin = createAction('[Admin] Approve Pin', props<{ id: number }>());
export const approvePinSuccess = createAction('[Admin] Approve Pin Success', props<{ id: number }>());
export const rejectPin = createAction('[Admin] Reject Pin', props<{ id: number }>());
export const rejectPinSuccess = createAction('[Admin] Reject Pin Success', props<{ id: number }>());
export const resolveReport = createAction('[Admin] Resolve Report', props<{ id: number }>());
export const resolveReportSuccess = createAction('[Admin] Resolve Report Success', props<{ id: number }>());
export const adminDeletePost = createAction('[Admin] Delete Post', props<{ id: number }>());
export const adminDeletePostSuccess = createAction('[Admin] Delete Post Success', props<{ id: number }>());
export const adminActionFailure = createAction('[Admin] Action Failure', props<{ error: string }>());
