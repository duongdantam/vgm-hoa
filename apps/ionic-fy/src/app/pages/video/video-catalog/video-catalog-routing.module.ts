import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VideoCatalogPage } from './video-catalog.page';

const routes: Routes = [
  {
    path: '',
    component: VideoCatalogPage,
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VideoCatalogPageRoutingModule { }
