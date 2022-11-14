import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyPage } from './my.page';

const routes: Routes = [
  {
    path: '',
    component: MyPage,
    children: [
      // { path: '', redirectTo: 'all', pathMatch: 'full' },
      // { path: '**', redirectTo: 'all', pathMatch: 'full' },
      {
        path: 'all',
        loadChildren: () =>
          import('./my-all/my-all.module').then((m) => m.MyAllPageModule),
      },
      {
        path: 'favorite',
        loadChildren: () =>
          import('./my-favorite/my-favorite.module').then(
            (m) => m.MyFavoritePageModule
          ),
      },
      {
        path: 'favorite/:id',
        loadChildren: () =>
          import('./my-favorite/my-favorite.module').then(
            (m) => m.MyFavoritePageModule
          ),
      },
      {
        path: 'download',
        loadChildren: () =>
          import('./my-download/my-download.module').then(
            (m) => m.MyDownloadPageModule
          ),
      },
      {
        path: 'download/:id',
        loadChildren: () =>
          import('./my-download/my-download.module').then(
            (m) => m.MyDownloadPageModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MyPageRoutingModule {}
