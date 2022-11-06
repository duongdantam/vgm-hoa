import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyAllPage } from './my-all.page';

const routes: Routes = [
  {
    path: '',
    component: MyAllPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MyAllPageRoutingModule { }
