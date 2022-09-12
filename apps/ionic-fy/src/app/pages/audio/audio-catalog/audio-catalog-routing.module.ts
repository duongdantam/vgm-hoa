import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AudioCatalogPage } from './audio-catalog.page';

const routes: Routes = [
  {
    path: '',
    component: AudioCatalogPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AudioCatalogPageRoutingModule { }
