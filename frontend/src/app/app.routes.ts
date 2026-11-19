import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { FeedComponent } from './features/feed/feed.component';
import { StatusListComponent } from './features/feed/status-list.component';
import { PostDetailComponent } from './features/posts/post-detail.component';
import { CreatePostComponent } from './features/posts/create-post.component';
import { ProfileComponent } from './features/profile/profile.component';
import { MeComponent } from './features/profile/me.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { AdminComponent } from './features/admin/admin.component';
import { AdsComponent } from './features/ads/ads.component';

export const routes: Routes = [
  { path: '', redirectTo: '/feed', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'feed', component: FeedComponent, canActivate: [authGuard] },
  { path: 'post/:id', component: PostDetailComponent, canActivate: [authGuard] },
  { path: 'create-post', component: CreatePostComponent, canActivate: [authGuard] },
  { path: 'profile/:username', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'me', component: MeComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  { path: 'solved', component: StatusListComponent, canActivate: [authGuard], data: { status: 'solved' } },
  { path: 'dustbin', component: StatusListComponent, canActivate: [authGuard], data: { status: 'dustbin' } },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] },
  { path: 'ads', component: AdsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/feed' },
];
