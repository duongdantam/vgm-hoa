import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
	selector: 'fy-my',
	templateUrl: './my.page.html',
	styleUrls: ['./my.page.scss'],
})
export class MyPage implements OnInit {
	public activeHref: string = '';
	public isHidden: boolean = false;
	constructor(
		private router: Router,
	) {
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				if (event.url.includes('/tabs/my')) {
					this.activeHref = event.url;
					this.isHidden = /\?id=.*/.test(event.url) ? true : false;
				}
			}
		})
	}

	ngOnInit() {
	}

}
