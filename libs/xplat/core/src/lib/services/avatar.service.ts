import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AvatarService {
  public MAP: { [key: string]: string } = {
    'co-ms-pham-xuan-thieu': 'jpeg',
    'co-ms-doan-van-mieng': 'jpeg',
    'ms-chau-tu-ton': 'jpeg',
    'ms-nguyen-ngoc-thuan': 'jpeg',
    'ms-nguyen-huu-binh': 'jpeg',
    'ms-nguyen-huu-mac': 'jpeg',
    'ms-phan-vinh-cu': 'jpeg',
    'ms-thai-phuoc-truong': 'jpeg',
    'ms-tran-cong-chanh': 'jpeg',
    'ms-dang-minh-tri': 'jpeg',
    'ms-le-dinh-trung': 'jpeg',
    'ms-hua-trung-tin': 'jpeg',
  };
  public MAP_KEY_WORDS: { [key: string]: string } = {
    'pham-xuan-thieu': 'co-ms-pham-xuan-thieu',
    'doan-van-mieng': 'co-ms-doan-van-mieng',
    'chau-tu-ton': 'ms-chau-tu-ton',
    'nguyen-ngoc-thuan': 'ms-nguyen-ngoc-thuan',
    'nguyen-huu-binh': 'ms-nguyen-huu-binh',
    'nguyen-huu-mac': 'ms-nguyen-huu-mac',
    'phan-vinh-cu': 'ms-phan-vinh-cu',
    'thai-phuoc-truong': 'ms-thai-phuoc-truong',
    'dang-minh-tri': 'ms-dang-minh-tri',
    'tran-cong-chanh': 'ms-tran-cong-chanh',
    dmt: 'ms-dang-minh-tri',
    htt: 'ms-hua-trung-tin',
    'hua-trung-tin': 'ms-hua-trung-tin',
    'le-dinh-trung': 'ms-le-dinh-trung',
    ldt: 'ms-le-dinh-trung',
  };
  constructor() {}

  hasAvatar(url: string) {
    return Boolean(this.MAP[url]);
  }

  getThumbnails(key: string) {
    if (this.MAP[key]) {
      return `./assets/avatars/${key}.${this.MAP[key]}`;
    }
    return null;
  }

  smartUrl(url: string) {
    for (const key in this.MAP_KEY_WORDS) {
      if (url.indexOf(key) > -1) {
        return this.getThumbnails(this.MAP_KEY_WORDS[key]);
      }
    }
    return null;
  }

  public getAvatarByUrl(url: string) {
    return this.smartUrl(url);
  }
}
