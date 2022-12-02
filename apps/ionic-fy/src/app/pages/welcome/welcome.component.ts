import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Platform, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as semverCompare from 'semver-compare';
import { BaseComponent, DataFetchService } from '@fy/xplat/core';

@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.component.html',
  styles: [
    `
      ion-content {
        --background: var(--ion-color-light);
      }
      /* ion-button {
           border-radius: 4px;
              width: 250px;
              height: 45px;
              margin: 0;
              position: absolute;
      } */

      /* ion-button:hover {
        background-color: var(--ion-color-primary-tint); */
     
      }
      ion-progress-bar {
        height: 45px;
        width: 250px;
        border-radius: 4px;
        z-index: -1;
        margin: 0;
        --progress-background: var(--ion-color-primary-tint);
      }
      .responsive-logo {
        width: 150px;
      }
      .download-progress {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(var(--ion-color-primary-rgb), 0.1);
        animation: download 1.5s infinite;
        top: 0;
      }
      @keyframes download {
        from {
          width: 0%;
        }
        to {
          width: 100%;
        }
      }

    `,
  ],
})
export class WelcomeComponent extends BaseComponent implements OnInit {
  timer = 0;
  dataReady = false;
  videoList = [];
  mobileVersion = {
    android: '1.0.1',
    ios: '1.0.1',
  };
  storeUrl = {
    android: 'market://details?id=com.fy.tv',
    ios: 'itms-apps://itunes.apple.com/app/fy-tv/id1438483905',
  };
  constructor(
    private router: Router,
    private zone: NgZone,
    public dataFetchService: DataFetchService,
    private platform: Platform,
    private translateService: TranslateService,
    public alertController: AlertController
  ) {
    super();
  }

  async ngOnInit() {
    const countUpTimer = setInterval(() => {
      // console.log('interval called');

      this.timer += 0.05;
      if (this.timer >= 3) this.timer = 3;
      if (this.dataFetchService.isInitialized && this.dataReady) {
        this.timer = 3;
        setTimeout(() => {
          this.handleEnter();
          clearInterval(countUpTimer);
        }, 40);
      }
    }, 50);
    await this.dataFetchService.init();
    if (this.platform.is('capacitor')) {
      if (this.platform.is('android')) await this.checkMobileVersion('android');
      if (this.platform.is('ios')) await this.checkMobileVersion('ios');
    }
    await this.dataFetchService.fetchAPIVersion();
    const fetchVideo = this.dataFetchService
      .fetchRoot('video')
      .then(async (list) => {
        if (list) {
          this.videoList = list;
          list.forEach(async (category) => {
            const topicList = await this.dataFetchService.fetchTopicList(
              category.url
            );
            if (topicList) {
              topicList.children.forEach(async (childTopic) => {
                await this.dataFetchService.fetchTopicList(childTopic.url);
              });
            }
          });
        }
      });

    const fetchAudio = this.dataFetchService
      .fetchRoot('audio')
      .then(async (list) => {
        if (list) {
          list.forEach(async (category) => {
            await this.dataFetchService.fetchTopicList(category.url);
          });
        }
      });

    await Promise.all([fetchVideo, fetchAudio]).then((result) => {
      this.dataReady = true;
    });
  }

  async handleEnter() {
    // await this.router.navigate(['/tabs']);
    await this.router.navigate(['/tabs', 'home']);
    // await this.router.navigate(['/tabs', 'video', 'catalog'], {
    //   queryParams: { topicUrl: this.videoList[0].url },
    // });
  }

  async checkMobileVersion(platform: string) {
    console.log(
      this.mobileVersion[platform],
      this.dataFetchService.mobileVersion[platform],
      semverCompare(
        this.dataFetchService.mobileVersion[platform],
        this.mobileVersion[platform]
      )
    );
    if (
      /^(\d+)\.(\d+)\.(\d+)$/.test(this.mobileVersion[platform]) &&
      /^(\d+)\.(\d+)\.(\d+)$/.test(
        this.dataFetchService.mobileVersion[platform]
      )
    ) {
      if (
        semverCompare(
          this.dataFetchService.mobileVersion[platform],
          this.mobileVersion[platform]
        ) > 0
      )
        await this.presentAlertConfirm(platform);
    }
  }

  async presentAlertConfirm(platform: string) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: `${this.translateService.instant('msg.inform')}`,
      message: `${this.translateService.instant('msg.newversion')}`,
      buttons: [
        {
          text: `${this.translateService.instant('msg.later')}`,
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            console.log('Confirm Cancel: blah');
          },
        },
        {
          text: `${this.translateService.instant('msg.update')}`,
          handler: () => {
            window.location.href = this.storeUrl[platform];
            console.log('Confirm Okay');
          },
        },
      ],
    });
    await alert.present();
  }
}
