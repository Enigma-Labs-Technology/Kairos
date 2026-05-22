import { BadRequestException } from "@nestjs/common";

// Mock the platform-libraries module
const mockValidatePublicUrlForSSRF: jest.Mock = jest.fn();
jest.mock("@calcom/platform-libraries", () => ({
  validatePublicUrlForSSRF: (url: string) => mockValidatePublicUrlForSSRF(url),
}));

import { validateWebhookUrl, validateWebhookUrlIfChanged } from "./validate-webhook-url";

describe("validateWebhookUrl", () => {
  beforeEach(() => {
    mockValidatePublicUrlForSSRF.mockReset();
  });

  it("does not throw when URL is valid", async () => {
    mockValidatePublicUrlForSSRF.mockResolvedValue({ isValid: true });

    await expect(validateWebhookUrl("https://example.com/webhook")).resolves.toBeUndefined();
    expect(mockValidatePublicUrlForSSRF).toHaveBeenCalledWith("https://example.com/webhook");
  });

  it("throws BadRequestException when URL is invalid", async () => {
    mockValidatePublicUrlForSSRF.mockResolvedValue({ isValid: false, error: "Private IP address" });

    await expect(validateWebhookUrl("https://127.0.0.1/webhook")).rejects.toThrow(BadRequestException);
    await expect(validateWebhookUrl("https://127.0.0.1/webhook")).rejects.toThrow(
      "Webhook URL is not allowed: Private IP address"
    );
  });

  it("includes error message from validation result", async () => {
    mockValidatePublicUrlForSSRF.mockResolvedValue({ isValid: false, error: "Blocked hostname" });

    await expect(validateWebhookUrl("https://localhost/webhook")).rejects.toThrow(
      "Webhook URL is not allowed: Blocked hostname"
    );
  });

  it("handles validation result without error message", async () => {
    mockValidatePublicUrlForSSRF.mockResolvedValue({ isValid: false });

    await expect(validateWebhookUrl("invalid-url")).rejects.toThrow("Webhook URL is not allowed: undefined");
  });
});

describe("validateWebhookUrlIfChanged", () => {
  beforeEach(() => {
    mockValidatePublicUrlForSSRF.mockReset();
  });

  it("validates URL when it is different from existing", async () => {
    mockValidatePublicUrlForSSRF.mockResolvedValue({ isValid: true });

    await validateWebhookUrlIfChanged("https://new.com/webhook", "https://old.com/webhook");

    expect(mockValidatePublicUrlForSSRF).toHaveBeenCalledWith("https://new.com/webhook");
  });

  it("throws when new URL is different and invalid", async () => {
    mockValidatePublicUrlForSSRF.mockResolvedValue({
      isValid: false,
      error: "Only HTTPS URLs are allowed",
    });

    await expect(
      validateWebhookUrlIfChanged("http://new.com/webhook", "https://old.com/webhook")
    ).rejects.toThrow(BadRequestException);
  });

  it("does not validate when URL is unchanged", async () => {
    await validateWebhookUrlIfChanged("https://same.com/webhook", "https://same.com/webhook");

    expect(mockValidatePublicUrlForSSRF).not.toHaveBeenCalled();
  });

  it("does not validate when new URL is undefined", async () => {
    await validateWebhookUrlIfChanged(undefined, "https://existing.com/webhook");

    expect(mockValidatePublicUrlForSSRF).not.toHaveBeenCalled();
  });

  it("validates when existing URL is undefined and new URL is provided", async () => {
    mockValidatePublicUrlForSSRF.mockResolvedValue({ isValid: true });

    await validateWebhookUrlIfChanged("https://new.com/webhook", undefined);

    expect(mockValidatePublicUrlForSSRF).toHaveBeenCalledWith("https://new.com/webhook");
  });

  it("does not validate when both URLs are undefined", async () => {
    await validateWebhookUrlIfChanged(undefined, undefined);

    expect(mockValidatePublicUrlForSSRF).not.toHaveBeenCalled();
  });
});
