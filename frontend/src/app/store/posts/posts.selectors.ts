import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PostsState } from './posts.reducer';

export const selectPostsState = createFeatureSelector<PostsState>('posts');
export const selectAllPosts = createSelector(selectPostsState, (s) => s.list);
export const selectPinnedPosts = createSelector(selectAllPosts, (list) => list.filter((p) => p.is_pinned));
export const selectOpenPosts = createSelector(selectAllPosts, (list) =>
  list.filter((p) => !p.is_pinned && p.status === 'open'),
);
export const selectSolvedPosts = createSelector(selectAllPosts, (list) =>
  list.filter((p) => p.status === 'solved'),
);
export const selectDustbinPosts = createSelector(selectAllPosts, (list) =>
  list.filter((p) => p.status === 'dustbin'),
);
export const selectSelectedPost = createSelector(selectPostsState, (s) => s.selected);
export const selectComments = createSelector(selectPostsState, (s) => s.comments);
export const selectPostsLoading = createSelector(selectPostsState, (s) => s.loading);
export const selectPostsError = createSelector(selectPostsState, (s) => s.error);
export const selectPostsMessage = createSelector(selectPostsState, (s) => s.message);
export const selectCreatedPost = createSelector(selectPostsState, (s) => s.createdPost);
export const selectCreating = createSelector(selectPostsState, (s) => s.creating);
