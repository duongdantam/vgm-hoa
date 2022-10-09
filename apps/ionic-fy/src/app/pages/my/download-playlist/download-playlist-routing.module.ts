import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DownloadPlaylistPage } from './download-playlist.page';

const routes: Routes = [
  {
    path: '',
    component: DownloadPlaylistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DownloadPlaylistPageRoutingModule { }
