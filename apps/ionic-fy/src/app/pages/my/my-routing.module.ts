import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyPage } from './my.page';

const routes: Routes = [
  {
    path: '',
    component: MyPage,
    children: [
      // { path: '', redirectTo: 'all', pathMatch: 'full' },
      // { path: '**', redirectTo: 'all', pathMatch: 'full' },
      {
        path: 'all',
        loadChildren: () =>
          import('./my-all/my-all.module').then((m) => m.MyAllPageModule),
      },
      {
        path: 'favorite',
        loadChildren: () =>
          import('./favorite-playlist/favorite-playlist.module').then((m) => m.FavoritePlaylistPageModule),
      },
      {
        path: 'favorite/:id',
        loadChildren: () =>
          import('./favorite-playlist/favorite-playlist.module').then((m) => m.FavoritePlaylistPageModule),
      },
      {
        path: 'download',
        loadChildren: () =>
          import('./download-playlist/download-playlist.module').then((m) => m.DownloadPlaylistPageModule),
      },
      {
        path: 'download/:id',
        loadChildren: () =>
          import('./download-playlist/download-playlist.module').then((m) => m.DownloadPlaylistPageModule),
      },
    ],
  },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MyPageRoutingModule { }
