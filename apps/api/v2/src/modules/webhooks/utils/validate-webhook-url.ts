import { validatePublicUrlForSSRF } from "@calcom/platform-libraries";
import { BadRequestException } from "@nestjs/common";

export async function validateWebhookUrl(subscriberUrl: string): Promise<void> {
  const validation = await validatePublicUrlForSSRF(subscriberUrl);
  if (!validation.isValid) {
    throw new BadRequestException(`Webhook URL is not allowed: ${validation.error}`);
  }
}

export async function validateWebhookUrlIfChanged(
  newSubscriberUrl: string | undefined,
  existingSubscriberUrl: string | undefined
): Promise<void> {
  if (newSubscriberUrl && newSubscriberUrl !== existingSubscriberUrl) {
    await validateWebhookUrl(newSubscriberUrl);
  }
}
