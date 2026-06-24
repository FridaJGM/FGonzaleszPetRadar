import { Module, Global, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as appInsights from 'applicationinsights';

@Global()
@Module({})
export class TelemetryModule implements OnModuleInit {
  private readonly logger = new Logger(TelemetryModule.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const connStr = this.config.get<string>('APPLICATIONINSIGHTS_CONNECTION_STRING');
    if (!connStr) {
      this.logger.warn(
        'APPLICATIONINSIGHTS_CONNECTION_STRING not set — telemetry disabled.',
      );
      return;
    }

    appInsights
      .setup(connStr)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true, true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .start();

    this.logger.log('Azure Application Insights initialized.');
  }
}
