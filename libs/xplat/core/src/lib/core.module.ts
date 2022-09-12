import {
	ModuleWithProviders,
	NgModule,
	Optional,
	SkipSelf,
	Inject,
} from '@angular/core';
import { APP_BASE_HREF, CommonModule } from '@angular/common';
// libs
import { TranslateService } from '@ngx-translate/core';
import { throwIfAlreadyLoaded } from '@fy/xplat/utils';
// app
import { environment } from './environments/environment';
import {
	LogService,
	PlatformLanguageToken,
	WindowService,
	DataFetchService,
	DetectService,
	GoogleAnalyticsService,
	LocalforageService,
	AvatarService,
	PlayerService,
	OfflineService,
	QueueService
} from './services';

/**
 * DEBUGGING
 */
LogService.DEBUG.LEVEL_4 = !environment.production;

@NgModule({
	imports: [CommonModule],
})
export class CoreModule {
	// configuredProviders: *required to configure WindowService and others per platform
	static forRoot(
		configuredProviders: Array<any>
	): ModuleWithProviders<CoreModule> {
		return {
			ngModule: CoreModule,
			providers: [
				LogService,
				WindowService,
				LocalforageService,
				DataFetchService,
				DetectService,
				AvatarService,
				PlayerService,
				OfflineService,
				QueueService,
				GoogleAnalyticsService,
				{
					provide: APP_BASE_HREF,
					useValue: '/',
				},
				...configuredProviders,
			],
		};
	}

	constructor(
		@Optional()
		@SkipSelf()
		parentModule: CoreModule,
		@Inject(PlatformLanguageToken) lang: string,
		translate: TranslateService
	) {
		throwIfAlreadyLoaded(parentModule, 'CoreModule');
		// ensure default platform language is set
		translate.setDefaultLang('cn');
		// the lang to use, if the lang isn't available, it will use the current loader to get them
		translate.use('cn');
	}
}
