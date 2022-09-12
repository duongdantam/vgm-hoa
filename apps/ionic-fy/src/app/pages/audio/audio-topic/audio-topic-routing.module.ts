import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AudioTopicPage } from './audio-topic.page';

const routes: Routes = [
  {
    path: '',
    component: AudioTopicPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AudioTopicPageRoutingModule { }
