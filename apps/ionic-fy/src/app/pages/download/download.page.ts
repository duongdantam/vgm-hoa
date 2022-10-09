import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';

@Component({
	selector: 'fy-download',
	templateUrl: './download.page.html',
	styleUrls: ['./download.page.scss'],
})
export class DownloadPage implements OnInit {
	public activeHref: string = '';
	constructor(
		private router: Router,
		private playerService: PlayerService
	) {
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd && event.url.includes('/tabs/download')) {
				this.activeHref = event.url;
			}
		})
	}

	ngOnInit() {
	}

	itemClick(type) {
		if (type === 'video') {
			// this.playerService.setVideoControlsHidden(true);
			// this.playerService.videoWidgetLocation$.next(2);
			if (this.playerService.videoWidgetLocation === 0) {
				this.playerService.videoWidgetLocation$.next(1);
			}
			this.playerService.videoPause();

		}
	}
}
