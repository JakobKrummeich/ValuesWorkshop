import { QRCodeSVG } from "qrcode.react";

const RENDERED_SIZE_PIXELS = 512;

export function QrCodeImage({
  payload,
  title,
  className,
}: {
  payload: string;
  title: string;
  className?: string;
}) {
  return (
    <QRCodeSVG
      value={payload}
      title={title}
      size={RENDERED_SIZE_PIXELS}
      className={className}
    />
  );
}
