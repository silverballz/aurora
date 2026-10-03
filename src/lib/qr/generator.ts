import QRCode from "qrcode";

export interface GenerateQrOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates a base64 Data URL PNG of the QR code
 */
export async function generateQrDataUrl(
  text: string,
  options?: GenerateQrOptions
): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: options?.width || 300,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || "#000000",
      light: options?.color?.light || "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
}

/**
 * Generates an SVG string of the QR code
 */
export async function generateQrSvg(
  text: string,
  options?: GenerateQrOptions
): Promise<string> {
  return await QRCode.toString(text, {
    type: "svg",
    width: options?.width || 300,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || "#000000",
      light: options?.color?.light || "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
}
