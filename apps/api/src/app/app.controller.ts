import { Controller, Get, Post, Body, Param, Req, Res, Request, Header, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('/ipfs/*')
  // @Header('content-type', 'application/octet-stream')
  async getData(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    console.time('fetch')
    const result = await this.appService.get(req.url)
    console.timeEnd('fetch');
    // console.log('final result:', result.length)
    res.status(HttpStatus.OK).send(result);
  }

  @Post('/ipfs/:cid/:value')
  async setData(@Param() params): Promise<{message: string}> {
    console.log('setting data')
    await this.appService.set(params.cid, params.value);
    return { message: 'Success' }
  }
}
