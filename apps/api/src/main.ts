// import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // logger: false 
  });
  // // const globalPrefix = '';
  // // app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3333;
  app.connectMicroservice({
    transport: Transport.REDIS,
    options: {
      url: process.env.REDIS_URL,
    }
  })
  app.enableCors();
  await app.startAllMicroservices();
  await app.listen(port, () => {
    console.log('Listening at http://localhost:' + port + '/');
  });
}

bootstrap();
