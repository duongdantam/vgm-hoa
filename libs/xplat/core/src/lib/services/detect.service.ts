import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DetectService {
  constructor() {
  }

  async swCheck(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration()
          .then(reg => {
            let serviceWorker;
            if (reg.installing) {
              serviceWorker = reg.installing;
            } else if (reg.waiting) {
              serviceWorker = reg.waiting;
            } else if (reg.active) {
              serviceWorker = reg.active;
            }
            console.log('SW State from detect:', serviceWorker.state);

            if (serviceWorker.state !== 'activated') {
              window.location.replace('http://localhost:4200') // window.location.hostname
              resolve(false)
            } else {
              resolve(true)
            }
          })
      } else {
        resolve(false)
      }
    })
  }
}
