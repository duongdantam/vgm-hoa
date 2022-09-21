import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BaseComponent,
  DataFetchService,
  LocalforageService,
} from '@fy/xplat/core';

@Component({
  selector: 'page-home',
  templateUrl: 'home.component.html',
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
export class HomeComponent extends BaseComponent implements OnInit {
  timer = 0;
  dataReady = false;
  videoList = [];
  constructor(
    private router: Router,
    // private activatedRoute: ActivatedRoute,
    private zone: NgZone,
    public dataFetchService: DataFetchService // private localforageService: LocalforageService
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
    await this.dataFetchService.fetchAPIVersion();
    await this.dataFetchService.fetchRoot('video').then(async (list) => {
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

    await this.dataFetchService.fetchRoot('audio').then(async (list) => {
      if (list) {
        list.forEach(async (category) => {
          await this.dataFetchService.fetchTopicList(category.url);
        });
      }
    });
    this.dataReady = true;
  }

  async handleEnter() {
    // await this.router.navigate(['/tabs']);
    await this.router.navigate(['/tabs', 'video', 'catalog'], {
      queryParams: { topicUrl: this.videoList[0].url },
    });
  }
}
