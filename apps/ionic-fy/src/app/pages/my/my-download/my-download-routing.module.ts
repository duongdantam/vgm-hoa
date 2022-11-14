import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyDownloadPage } from './my-download.page';

const routes: Routes = [
  {
    path: '',
    component: MyDownloadPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MyDownloadPageRoutingModule {}
