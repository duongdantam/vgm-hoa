import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';

@Component({
	selector: 'fy-favorite',
	templateUrl: './favorite.page.html',
	styleUrls: ['./favorite.page.scss'],
})
export class FavoritePage implements OnInit {
	public activeHref: string = '';
	constructor(
		private router: Router,
		private playerService: PlayerService
	) {
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				if (event.url.includes('/tabs/favorite')) {
					this.activeHref = event.url;
				}
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
