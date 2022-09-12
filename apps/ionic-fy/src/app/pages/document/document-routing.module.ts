import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DocumentPage } from './document.page';

const routes: Routes = [
  {
    path: '',
    component: DocumentPage,
    children: [
      {
        path: 'playlist',
        loadChildren: () =>
          import('./document-playlist/document-playlist.module').then(
            (m) => m.DocumentPlaylistPageModule
          ),
      },
      {
        path: 'playlist/:id',
        loadChildren: () =>
          import('./document-playlist/document-playlist.module').then(
            (m) => m.DocumentPlaylistPageModule
          ),
      },
      // { path: '', redirectTo: 'playlist', pathMatch: 'full' },
    ],
  },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DocumentPageRoutingModule { }
