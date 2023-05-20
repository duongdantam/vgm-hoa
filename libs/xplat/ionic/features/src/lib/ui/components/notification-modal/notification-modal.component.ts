import { Component, Input } from '@angular/core';
import { ToastController, ModalController, Platform } from '@ionic/angular';
// import { TranslateService } from '@ngx-translate/core';
// import { rightToLeftEnter } from 'libs/xplat/ionic/core/src/lib/animation';
// import { rightToLeftLeave } from 'libs/xplat/ionic/core/src/lib/animation';
// import { AlertController } from '@ionic/angular';
import { DataFetchService } from '@fy/xplat/core';


@Component({
	selector: 'fy-notification-modal',
	templateUrl: 'notification-modal.component.html'
})

export class NotificationModalComponent {
	@Input() desktopAppUpdateUrl = '';
	@Input() notificationArr = [];

	constructor(
		public platform: Platform,
		public modalController: ModalController,
		// public toastController: ToastController,
		// public alertController: AlertController,
		private dataFetchService: DataFetchService,
		// private translateService: TranslateService
	) { }

	async downloadDesktopApp() {
		this.dismiss();
		// await this.dataFetchService.downloadAppAlertConfirm(this.desktopAppUpdateUrl);
	}

	// onLink() {
	// 	// copy link to clipboard
	// 	navigator.clipboard.writeText(this.sharedMessage)
	// 	this.presentToast(this.translateService.instant('msg.copylink'))
	// 	this.dismiss();
	// }

	// async presentToast(message) {
	// 	const toast = await this.toastController.create({
	// 		message: message,
	// 		position: 'top',
	// 		duration: 2000,
	// 		cssClass: 'toast-info'
	// 	});
	// 	toast.present();
	// }

	dismiss() {
		this.modalController.dismiss({
			'dismissed': true
		});
	}

}
