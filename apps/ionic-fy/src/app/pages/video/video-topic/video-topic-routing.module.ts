import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VideoTopicPage } from './video-topic.page';

const routes: Routes = [
  {
    path: '',
    component: VideoTopicPage,
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VideoTopicPageRoutingModule { }
