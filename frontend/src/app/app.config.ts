import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { authReducer } from './store/auth/auth.reducer';
import { postsReducer } from './store/posts/posts.reducer';
import { notificationsReducer } from './store/notifications/notifications.reducer';
import { adminReducer } from './store/admin/admin.reducer';
import { AuthEffects } from './store/auth/auth.effects';
import { PostsEffects } from './store/posts/posts.effects';
import { NotificationsEffects } from './store/notifications/notifications.effects';
import { AdminEffects } from './store/admin/admin.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({
      auth: authReducer,
      posts: postsReducer,
      notifications: notificationsReducer,
      admin: adminReducer,
    }),
    provideEffects([AuthEffects, PostsEffects, NotificationsEffects, AdminEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
