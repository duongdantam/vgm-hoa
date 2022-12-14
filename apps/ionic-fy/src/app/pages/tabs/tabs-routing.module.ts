import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
// import { SideMenuComponent } from '@fy/xplat/ionic/features';
import { TabsPage } from './tabs.page';
import { AppGuard } from "../../app.guard";

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    canActivate: [AppGuard],
    canDeactivate: [AppGuard],
    children: [
      {
        path: 'home',
        loadChildren: () =>
          import('../home/home.module').then((m) => m.HomePageModule),
      },
      {
        path: 'video',
        loadChildren: () =>
          import('../video/video.module').then((m) => m.VideoPageModule),
      },
      {
        path: 'audio',
        loadChildren: () =>
          import('../audio/audio.module').then((m) => m.AudioPageModule),
      },
      {
        path: 'my',
        loadChildren: () =>
          import('../my/my.module').then((m) => m.MyPageModule),
      },
      // {
      //   path: 'favorite',
      //   loadChildren: () =>
      //     import('../favorite/favorite.module').then(
      //       (m) => m.FavoritePageModule
      //     ),
      // },
      // {
      //   path: 'download',
      //   loadChildren: () =>
      //     import('../download/download.module').then(
      //       (m) => m.DocumentPageModule
      //     ),
      // },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  // { path: '', redirectTo: 'catalog', pathMatch: 'full' },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule { }
