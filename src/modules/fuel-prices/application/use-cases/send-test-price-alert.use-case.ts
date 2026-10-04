import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { PRICE_ALERT_NOTIFIER } from '../../domain/services/price-alert-notifier';
import type { PriceAlertNotifier } from '../../domain/services/price-alert-notifier';

@Injectable()
export class SendTestPriceAlertUseCase {
  constructor(
    @Inject(PRICE_ALERT_NOTIFIER)
    private readonly notifier: PriceAlertNotifier,
  ) {}

  async execute(): Promise<UnifiedResponse<{ sent: boolean }>> {
    const sent = await this.notifier.sendTest();

    return ok({
      message: sent
        ? 'Test price alert sent to the price-test topic'
        : 'Push is not configured or the send failed; check FIREBASE_SERVICE_ACCOUNT and the server log',
      data: { sent },
    });
  }
}
