import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VideoSearchPage } from './video-search.page';

const routes: Routes = [
  {
    path: '',
    component: VideoSearchPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VideoSearchPageRoutingModule { }
