import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { IpfsService } from './ipfs/ipfs.service';
import * as path from 'path';
import PQueue from 'p-queue';
const queue = new PQueue({ concurrency: 10 });
@Injectable()
export class AppService {
  constructor(
    private readonly redisService: RedisService,
    private readonly ipfsService: IpfsService,
  ) { }

  async get(cid: string): Promise<any> {
    const client = await this.redisService.getClient()
    let result: any = await client.getBuffer(cid);
    // console.log('getResult', result)
    if (result === null) {
      result = await this.ipfsService.get(cid);
      console.log('cache new:', cid, result.length)
      this.set(cid, result);
      if (path.extname(cid) === '.vgmx') {
        this.prefetchData(cid);
      }
    } else {
      console.log('cache hit:', cid, result.length);
    }
    return result;
  }

  async prefetchData(cid: string) {
    const currentSegment = parseInt(path.basename(cid).match(/\d+/).toString());
    if (currentSegment % 10 === 0) {
      for (let i = 1; i < 10; i++) {
        (async () => {
          await queue.add(async () => {
            const nextCID = `${path.dirname(cid)}/${path.basename(cid).replace(currentSegment.toString(), (currentSegment + i).toString())}`
            const nextResult = await this.ipfsService.get(nextCID);
            if (nextResult) {
              this.set(nextCID, nextResult);
              console.log('prefetching', nextCID, nextResult.length);
            } else {
              queue.clear();
            }
          });
        })();
      }
    }
  }

  async set(cid: string, data: any): Promise<void> {
    const client = await this.redisService.getClient()
    const expiredTime = process.env.REDIS_CACHE_EXPIRE_TIME; // second
    await client.set(cid, data, 'EX', expiredTime)
  }

}
