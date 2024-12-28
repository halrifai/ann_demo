import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../services/auth.service';

@Injectable()
export class TokenCleanupService {
  constructor(private readonly authService: AuthService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleTokenCleanup() {
    try {
      const result = await this.authService.cleanupOldTokens();
      console.log('Token cleanup completed:', result);
    } catch (error) {
      console.error('Token cleanup failed:', error);
    }
  }
}