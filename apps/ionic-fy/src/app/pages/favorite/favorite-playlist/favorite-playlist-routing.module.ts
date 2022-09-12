import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FavoritePlaylistPage } from './favorite-playlist.page';

const routes: Routes = [
  {
    path: '',
    component: FavoritePlaylistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FavoritePlaylistPageRoutingModule { }
