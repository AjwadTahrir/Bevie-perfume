# Bank QR image

`bank-qr.svg` is a visible placeholder, not a working QR.

1. Add your real bank QR here as `bank-qr.png` (or JPG/WebP).
2. Update `src/config/payment.js`: set `qrImagePath` to `/payment/bank-qr.png`, enter the real `recipientName`, and set `isConfigured: true`.
3. Check that scanning it displays the correct account holder before enabling real payments.

Files in this directory are public. Do not put payment receipts here.
