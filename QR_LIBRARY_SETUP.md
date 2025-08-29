# QR Code Library Setup for Driver QR Generator

## Install QR Code Library

To enable actual QR code generation in the driver app, install the QR code library:

```bash
npm install react-native-qrcode-svg react-native-svg
```

## Enable QR Code Display

Once installed, uncomment the import in `screens/driver/components/QRGenerator.tsx`:

```typescript
// Change this:
// import QRCode from 'react-native-qrcode-svg'; // Uncomment when library is installed

// To this:
import QRCode from 'react-native-qrcode-svg';
```

Then replace the placeholder QR display with the actual QRCode component:

```typescript
// Replace the placeholder with:
<QRCode
  value={qrValue}
  size={qrSize}
  color={COLORS.black}
  backgroundColor={COLORS.white}
  logo={require('../../../assets/images/icon.png')}
  logoSize={qrSize * 0.15}
  logoBackgroundColor={COLORS.white}
  logoMargin={2}
  logoBorderRadius={8}
/>
```

## Alternative: Web-based QR Generator

If you prefer not to install the library, you can use a web-based approach:

```typescript
const generateQRImageURL = (data: string) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data)}`;
};

// Then use it in an Image component:
<Image 
  source={{ uri: generateQRImageURL(qrValue) }}
  style={{ width: qrSize, height: qrSize }}
/>
```

This will generate QR codes via an external API without requiring additional dependencies.
