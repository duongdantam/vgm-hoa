import {
	APP_BASE_HREF,
	LocationStrategy,
	PathLocationStrategy,
	HashLocationStrategy
} from '@angular/common';
import { NgModule } from '@angular/core';
import { PreloadAllModules, Routes, RouterModule } from '@angular/router';

const routes: Routes = [
	{ path: '', redirectTo: 'welcome', pathMatch: 'full' },
	{
		path: 'welcome',
		loadChildren: () =>
			import('./pages/welcome/welcome.module').then((m) => m.WelcomeModule),
	},
	{
		path: 'tabs',
		loadChildren: () =>
			import('./pages/tabs/tabs.module').then((m) => m.TabsPageModule),
	},
	{ path: '**', redirectTo: 'welcome', pathMatch: 'full' },
	// {
	//   path: '**',
	//   loadChildren: () =>
	//     import('./pages/notfound/notfound.module').then(
	//       (m) => m.NotfoundPageModule
	//     ),
	// },
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
	],
	providers: [
		{
			provide: LocationStrategy,
			useClass: HashLocationStrategy // HashLocationStrategy or PathLocationStrategy
		},
		{ provide: APP_BASE_HREF, useValue: '/' },
	],
	exports: [RouterModule],
})
export class AppRoutingModule { }
