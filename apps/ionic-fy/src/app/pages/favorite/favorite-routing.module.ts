import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FavoritePage } from './favorite.page';

const routes: Routes = [
  {
    path: '',
    component: FavoritePage,
    children: [
      {
        path: 'playlist',
        loadChildren: () =>
          import('./favorite-playlist/favorite-playlist.module').then(
            (m) => m.FavoritePlaylistPageModule
          ),
      },
      {
        path: 'playlist/:id',
        loadChildren: () =>
          import('./favorite-playlist/favorite-playlist.module').then(
            (m) => m.FavoritePlaylistPageModule
          ),
      },
      // { path: '', redirectTo: 'playlist', pathMatch: 'full' },
    ],
  },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FavoritePageRoutingModule { }
