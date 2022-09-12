import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataFetchService, QueueService } from '@fy/xplat/core';
// import { TopicCategory } from '@fy/api-interfaces';
@Component({
  selector: 'fy-video-topic',
  templateUrl: './video-topic.page.html',
  styleUrls: ['./video-topic.page.scss'],
})
export class VideoTopicPage implements OnInit {
  public topicCategory: any | null = null;
  constructor(
    private activatedRoute: ActivatedRoute,
    private dataFetchService: DataFetchService,
    private queueService: QueueService
  ) {
  }


  async ngOnInit() {
    const { topicUrl } = this.activatedRoute.snapshot.params;
    if (topicUrl) {
      this.topicCategory = await this.dataFetchService.fetchTopicList(topicUrl);
      this.topicCategory.children.forEach(async (topic) => {
        topic.children = await this.dataFetchService.fetchTopicList(topic.url).then(list => list.children);
        for (let i = 0; i < 11; i++) {
          if (typeof topic.children[i] != "undefined") {
            (async () => {
              await this.queueService.queue.add(async () => {
                topic.children[i].value = topic.children[i].name.replace(/[\-\_]+/g, ' ');
                topic.children[i].href = topic.children[i].url;
                topic.children[i].thumb = await this.getItemThumbnail(topic.children[i]);
              });
            })();
          }
        }
      });
    } else {
      console.warn(`could not fetch data as topicUrl is undefined`);
    }
  }

  videoRefresh(event) {
    setTimeout(() => {
      // console.log('Async operation has ended');
      event.target.complete();
    }, 2000);
  }

  private getNonLeaf(item: any) {
    return new Promise(async (resolve) => {
      const recurse = async (item) => {
        if (item.isLeaf === null) {
          resolve(item)
        } else if (item.isLeaf === true || item.isLeaf === false) {
          await this.dataFetchService.fetchTopicList(item.url).then(list => { if (list.children[0]) recurse(list.children[0]); });
        }
      }
      recurse(item);
    })
  }

  private async getItemThumbnail(item: any) {
    if (item.isLeaf === null) {
      return await this.dataFetchService.getThumbnailUrl(item);
    }
    if (item.isLeaf === (true || false)) {
      const firstItem = await this.getNonLeaf(item);
      return await this.dataFetchService.getThumbnailUrl(firstItem);
    }
    // 'https://stream.fy.tv/fyV/01_BaiGiang/CacDienGia/MSNHB_DeHiepMotTrongPhucVu/preview/01.jpg';
  }



}
