import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DownloadPage } from './download.page';

const routes: Routes = [
  {
    path: '',
    component: DownloadPage,
    children: [
      {
        path: 'playlist',
        loadChildren: () =>
          import('../my/download-playlist/download-playlist.module').then(
            (m) => m.DownloadPlaylistPageModule
          ),
      },
      {
        path: 'playlist/:id',
        loadChildren: () =>
          import('../my/download-playlist/download-playlist.module').then(
            (m) => m.DownloadPlaylistPageModule
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
export class DownloadPageRoutingModule { }
