import { Component, Input } from '@angular/core';
import { ToastController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'fy-social-share-modal',
  templateUrl: 'social-share-modal.component.html'
})

export class SocialShareModalComponent {
  @Input() sharedMessage = '';
  facebookLink = `https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2F${this.sharedMessage}%2F&amp;src=sdkpreparse`;
  whatsappLink = `https://web.whatsapp.com/send?text=${this.sharedMessage}`;
  emailLink = `https://mail.google.com/mail/u/0/?to&su=FY:+Chia+Sẽ+Bài+Giảng&body=https://${this.sharedMessage}/&bcc&cc&fs=1&tf=cm`;
  constructor(
    public modalController: ModalController,
    public toastController: ToastController,
    private translateService: TranslateService
  ) { }

  onLink() {
    // copy link to clipboard
    navigator.clipboard.writeText(this.sharedMessage)
    this.presentToast(this.translateService.instant('msg.copylink'))
    this.dismiss();
  }
  async presentToast(message) {
    const toast = await this.toastController.create({
      message: message,
      position: 'top',
      duration: 2000,
      cssClass: 'toast-info'
    });
    toast.present();
  }

  dismiss() {
    this.modalController.dismiss({
      'dismissed': true
    });
  }
}
