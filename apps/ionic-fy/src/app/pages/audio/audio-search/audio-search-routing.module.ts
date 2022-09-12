import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AudioSearchPage } from './audio-search.page';

const routes: Routes = [
  {
    path: '',
    component: AudioSearchPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AudioSearchPageRoutingModule { }
