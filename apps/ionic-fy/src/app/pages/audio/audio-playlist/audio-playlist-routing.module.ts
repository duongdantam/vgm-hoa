import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AudioPlaylistPage } from './audio-playlist.page';

const routes: Routes = [
  {
    path: '',
    component: AudioPlaylistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AudioPlaylistPageRoutingModule {}
