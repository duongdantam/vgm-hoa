import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AudioPage } from './audio.page';

const routes: Routes = [
  {
    path: '',
    component: AudioPage,
    children: [
      {
        path: 'catalog',
        loadChildren: () =>
          import('./audio-catalog/audio-catalog.module').then(
            (m) => m.AudioCatalogPageModule
          ),
      },
      {
        path: 'catalog/:topicUrl',
        loadChildren: () =>
          import('./audio-catalog/audio-catalog.module').then(
            (m) => m.AudioCatalogPageModule
          ),
      },
      {
        path: 'topic',
        loadChildren: () =>
          import('./audio-topic/audio-topic.module').then(
            (m) => m.AudioTopicPageModule
          ),
      },
      {
        path: 'topic/:topicUrl',
        loadChildren: () =>
          import('./audio-topic/audio-topic.module').then(
            (m) => m.AudioTopicPageModule
          ),
      },
      {
        path: 'playlist',
        loadChildren: () =>
          import('./audio-playlist/audio-playlist.module').then(
            (m) => m.AudioPlaylistPageModule
          ),
      },
      {
        path: 'playlist/:topicUrl',
        loadChildren: () =>
          import('./audio-playlist/audio-playlist.module').then(
            (m) => m.AudioPlaylistPageModule
          ),
      },
      {
        path: 'search',
        loadChildren: () =>
          import('./audio-search/audio-search.module').then(
            (m) => m.AudioSearchPageModule
          ),
      },
      // { path: '', redirectTo: 'catalog', pathMatch: 'full' },
    ],
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AudioPageRoutingModule { }
