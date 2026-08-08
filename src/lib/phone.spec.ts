import { describe, expect, it } from "vitest";
import { toWhatsAppAddress } from "./phone";

describe("toWhatsAppAddress", () => {
  it("accepts a plain ten-digit mobile", () => {
    expect(toWhatsAppAddress("9876543210")).toBe("whatsapp:+919876543210");
  });

  it("accepts the country code in several shapes", () => {
    expect(toWhatsAppAddress("+91 98765 43210")).toBe("whatsapp:+919876543210");
    expect(toWhatsAppAddress("919876543210")).toBe("whatsapp:+919876543210");
    expect(toWhatsAppAddress("0919876543210")).toBe("whatsapp:+919876543210");
  });

  it("strips punctuation and a leading zero", () => {
    expect(toWhatsAppAddress("(98765)-43210")).toBe("whatsapp:+919876543210");
    expect(toWhatsAppAddress("09876543210")).toBe("whatsapp:+919876543210");
  });

  it("rejects numbers that are not Indian mobiles", () => {
    expect(toWhatsAppAddress("1234567890")).toBeNull(); // starts with 1
    expect(toWhatsAppAddress("98765")).toBeNull(); // too short
    expect(toWhatsAppAddress("98765432101234")).toBeNull(); // too long
    expect(toWhatsAppAddress("")).toBeNull();
    expect(toWhatsAppAddress("not a number")).toBeNull();
  });
});
