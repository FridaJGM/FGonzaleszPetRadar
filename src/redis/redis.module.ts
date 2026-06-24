import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const logger = new Logger('RedisModule');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        const host = config.get<string>('REDIS_HOST', 'localhost');
        const port = config.get<number>('REDIS_PORT', 6379);
        const password = config.get<string>('REDIS_PASSWORD') || undefined;

        const clientOptions = redisUrl
          ? { url: redisUrl }
          : {
              socket: { host, port },
              password,
            };

        const client = createClient(clientOptions);

        client.on('error', (err) => logger.error('[Redis] Error:', err));
        client.on('connect', () => logger.log('[Redis] Connected'));

        try {
          await client.connect();
        } catch (err) {
          logger.error('[Redis] Failed to connect — continuing without cache', err);
        }

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
