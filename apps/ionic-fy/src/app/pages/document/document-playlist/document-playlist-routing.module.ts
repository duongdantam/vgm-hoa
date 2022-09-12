import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DocumentPlaylistPage } from './document-playlist.page';

const routes: Routes = [
  {
    path: '',
    component: DocumentPlaylistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DocumentPlaylistPageRoutingModule { }
