import { createAction, props } from '@ngrx/store';
import { Post, PostComment } from '../../core/models';

export interface PostFilters {
  category?: string;
  gram_id?: number;
  para_id?: number;
  q?: string;
  status?: string;
}

export const loadPosts = createAction('[Posts] Load', props<{ filters?: PostFilters }>());
export const loadPostsSuccess = createAction('[Posts] Load Success', props<{ posts: Post[] }>());
export const loadPostsFailure = createAction('[Posts] Load Failure', props<{ error: string }>());

export const loadPost = createAction('[Posts] Load One', props<{ id: number }>());
export const loadPostSuccess = createAction('[Posts] Load One Success', props<{ post: Post }>());
export const loadPostFailure = createAction('[Posts] Load One Failure', props<{ error: string }>());

export const createPost = createAction('[Posts] Create', props<{ form: FormData }>());
export const createPostSuccess = createAction('[Posts] Create Success', props<{ post: Post }>());
export const createPostFailure = createAction('[Posts] Create Failure', props<{ error: string }>());
export const clearCreateState = createAction('[Posts] Clear Create State');

export const updatePost = createAction('[Posts] Update', props<{ id: number; form: FormData }>());
export const updatePostSuccess = createAction('[Posts] Update Success', props<{ post: Post }>());
export const updatePostFailure = createAction('[Posts] Update Failure', props<{ error: string }>());

export const deletePost = createAction('[Posts] Delete', props<{ id: number }>());
export const deletePostSuccess = createAction('[Posts] Delete Success', props<{ id: number }>());
export const deletePostFailure = createAction('[Posts] Delete Failure', props<{ error: string }>());

export const markSolved = createAction('[Posts] Mark Solved', props<{ id: number }>());
export const markSolvedSuccess = createAction('[Posts] Mark Solved Success', props<{ post: Post }>());
export const markSolvedFailure = createAction('[Posts] Mark Solved Failure', props<{ error: string }>());

export const requestPin = createAction('[Posts] Request Pin', props<{ id: number }>());
export const requestPinSuccess = createAction('[Posts] Request Pin Success', props<{ message: string }>());
export const requestPinFailure = createAction('[Posts] Request Pin Failure', props<{ error: string }>());

export const extendPin = createAction('[Posts] Extend Pin', props<{ id: number }>());
export const extendPinSuccess = createAction('[Posts] Extend Pin Success', props<{ message: string }>());
export const extendPinFailure = createAction('[Posts] Extend Pin Failure', props<{ error: string }>());

export const reportPost = createAction('[Posts] Report', props<{ id: number; reason: string }>());
export const reportPostSuccess = createAction('[Posts] Report Success', props<{ message: string }>());
export const reportPostFailure = createAction('[Posts] Report Failure', props<{ error: string }>());

export const loadComments = createAction('[Posts] Load Comments', props<{ postId: number }>());
export const loadCommentsSuccess = createAction('[Posts] Load Comments Success', props<{ comments: PostComment[] }>());
export const loadCommentsFailure = createAction('[Posts] Load Comments Failure', props<{ error: string }>());

export const addComment = createAction('[Posts] Add Comment', props<{ postId: number; body: string }>());
export const addCommentSuccess = createAction('[Posts] Add Comment Success', props<{ comment: PostComment }>());
export const addCommentFailure = createAction('[Posts] Add Comment Failure', props<{ error: string }>());

export const flagComment = createAction('[Posts] Flag Comment', props<{ id: number }>());
export const flagCommentSuccess = createAction('[Posts] Flag Comment Success', props<{ id: number }>());
export const flagCommentFailure = createAction('[Posts] Flag Comment Failure', props<{ error: string }>());

export const clearPostMessage = createAction('[Posts] Clear Message');
