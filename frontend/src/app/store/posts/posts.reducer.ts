import { createReducer, on } from '@ngrx/store';
import { Post, PostComment } from '../../core/models';
import * as PostsActions from './posts.actions';

export interface PostsState {
  list: Post[];
  selected: Post | null;
  comments: PostComment[];
  loading: boolean;
  error: string | null;
  message: string | null;
  createdPost: Post | null;
  creating: boolean;
}

export const initialPostsState: PostsState = {
  list: [],
  selected: null,
  comments: [],
  loading: false,
  error: null,
  message: null,
  createdPost: null,
  creating: false,
};

export const postsReducer = createReducer(
  initialPostsState,
  on(PostsActions.loadPosts, PostsActions.loadPost, PostsActions.loadComments,
    (s) => ({ ...s, loading: true, error: null })),
  on(PostsActions.loadPostsSuccess, (s, { posts }) => ({ ...s, list: posts, loading: false })),
  on(PostsActions.loadPostSuccess, (s, { post }) => ({ ...s, selected: post, loading: false })),
  on(PostsActions.loadCommentsSuccess, (s, { comments }) => ({ ...s, comments, loading: false })),
  on(PostsActions.loadPostsFailure, PostsActions.loadPostFailure, PostsActions.loadCommentsFailure,
    (s, { error }) => ({ ...s, loading: false, error })),
  on(PostsActions.createPost, (s) => ({ ...s, creating: true, error: null, createdPost: null })),
  on(PostsActions.createPostSuccess, (s, { post }) => ({
    ...s, creating: false, createdPost: post, list: [post, ...s.list],
  })),
  on(PostsActions.createPostFailure, (s, { error }) => ({ ...s, creating: false, error })),
  on(PostsActions.clearCreateState, (s) => ({ ...s, createdPost: null, error: null })),
  on(PostsActions.updatePostSuccess, PostsActions.markSolvedSuccess, (s, { post }) => ({
    ...s,
    selected: post,
    list: s.list.map((p) => (p.id === post.id ? post : p)),
  })),
  on(PostsActions.deletePostSuccess, (s, { id }) => ({
    ...s, list: s.list.filter((p) => p.id !== id), selected: null,
  })),
  on(PostsActions.requestPinSuccess, PostsActions.extendPinSuccess, PostsActions.reportPostSuccess,
    (s, { message }) => ({ ...s, message })),
  on(PostsActions.addCommentSuccess, (s, { comment }) => ({
    ...s, comments: [...s.comments, comment],
  })),
  on(PostsActions.flagCommentSuccess, (s, { id }) => ({
    ...s,
    comments: s.comments.map((c) =>
      c.id === id ? { ...c, flags_count: (c.flags_count ?? 0) + 1 } : c,
    ),
    message: 'কমেন্টটি ফ্ল্যাগ করা হয়েছে। ৫টি ফ্ল্যাগ হলে পোস্টটি নিজে থেকেই মুছে যাবে।',
  })),
  on(PostsActions.updatePostFailure, PostsActions.deletePostFailure, PostsActions.markSolvedFailure,
    PostsActions.requestPinFailure, PostsActions.extendPinFailure, PostsActions.reportPostFailure,
    PostsActions.addCommentFailure, PostsActions.flagCommentFailure,
    (s, { error }) => ({ ...s, error })),
  on(PostsActions.clearPostMessage, (s) => ({ ...s, message: null, error: null })),
);
