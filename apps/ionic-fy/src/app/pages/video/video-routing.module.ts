import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SideMenuComponent } from '@fy/xplat/ionic/features';

import { VideoPage } from './video.page';

const routes: Routes = [
  {
    path: '',
    component: VideoPage,
    children: [
      {
        path: 'catalog',
        loadChildren: () =>
          import('./video-catalog/video-catalog.module').then(
            (m) => m.VideoCatalogPageModule
          ),
      },
      {
        path: 'catalog/:topicUrl',
        loadChildren: () =>
          import('./video-catalog/video-catalog.module').then(
            (m) => m.VideoCatalogPageModule
          ),
      },
      {
        path: 'topic/:topicUrl',
        loadChildren: () =>
          import('./video-topic/video-topic.module').then(
            (m) => m.VideoTopicPageModule
          ),
      },
      {
        path: 'playlist/:topicUrl',
        loadChildren: () =>
          import('./video-playlist/video-playlist.module').then(
            (m) => m.VideoPlaylistPageModule
          ),
      },
      {
        path: 'search',
        loadChildren: () =>
          import('./video-search/video-search.module').then(
            (m) => m.VideoSearchPageModule
          ),
      },
      {
        path: 'player',
        loadChildren: () =>
          import('./video-player/video-player.module').then(
            (m) => m.VideoPlayerPageModule
          ),
      },
      // { path: '', redirectTo: 'catalog', pathMatch: 'full' },
      // {
      //   path: 'player/:itemUrl',
      //   loadChildren: () =>
      //     import('./video-player/video-player.module').then(
      //       (m) => m.VideoPlayerPageModule
      //     ),
      // },

      // { path: '', redirectTo: 'catalog', pathMatch: 'full' },
    ],
  },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VideoPageRoutingModule { }
