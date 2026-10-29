/* ==========================================================================
   MYTHOLIS LUXURY PARFUMS - COURIER PDF LABEL REBRANDER ENGINE
   Method 3: Automated Client-Side PDF Label Customization using pdf-lib
   Preserves 100% of Barcodes, Routing Hub Codes, and Buyer Coordinates
   ========================================================================== */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const LABEL_PRESETS = {
  'thermal-4x6-bottom': {
    name: 'Standard 4x6 Thermal Label (Bottom Mask)',
    description: 'Masks bottom return/shipped-by block on standard 4x6 thermal courier labels.',
    maskX: 14,
    maskY: 18,
    maskWidth: 260,
    maskHeight: 82,
    fontSize: 10,
    hasTopHeaderMask: false,
    topMaskX: 0,
    topMaskY: 0,
    topMaskWidth: 0,
    topMaskHeight: 0
  },
  'thermal-4x6-top-bottom': {
    name: '4x6 Thermal Label (Top Brand + Bottom Mask)',
    description: 'Masks both the top partner banner and the bottom seller info block.',
    maskX: 14,
    maskY: 18,
    maskWidth: 260,
    maskHeight: 82,
    fontSize: 10,
    hasTopHeaderMask: true,
    topMaskX: 14,
    topMaskY: 375,
    topMaskWidth: 160,
    topMaskHeight: 45
  },
  'a4-top-left': {
    name: 'A4 Sheet Courier Label (Top-Left Quadrant)',
    description: 'Calibrated for standard A4 4-per-page or single sheet printouts.',
    maskX: 25,
    maskY: 440,
    maskWidth: 245,
    maskHeight: 85,
    fontSize: 10,
    hasTopHeaderMask: false,
    topMaskX: 0,
    topMaskY: 0,
    topMaskWidth: 0,
    topMaskHeight: 0
  },
  'custom': {
    name: 'Custom Calibration Coordinates',
    description: 'Interactive manual alignment for specific courier thermal label layouts.',
    maskX: 14,
    maskY: 18,
    maskWidth: 260,
    maskHeight: 82,
    fontSize: 10,
    hasTopHeaderMask: false,
    topMaskX: 14,
    topMaskY: 375,
    topMaskWidth: 160,
    topMaskHeight: 45
  }
};

/**
 * Shiprocket Order Payload Generator (Defense-in-Depth)
 * Enforces Mytholis Luxury Parfums company branding across all outgoing shipments
 */
export function generateShiprocketOrderPayload(order, config = {}) {
  const items = Array.isArray(order.items) ? order.items : [];
  const orderId = order.orderId || order.id || `MYTH-${Date.now()}`;
  const subtotal = Number(order.finalPayable || order.total || order.subtotal || 3999);

  return {
    order_id: orderId,
    order_date: order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    pickup_location: config.pickupLocation || 'Primary',
    channel_id: config.channelId || '12602315',
    comment: 'Mytholis Haute Parfumerie Consignment - Handle With Care',
    
    // DEFENSE-IN-DEPTH BRAND OVERRIDE:
    company_name: 'MYTHOLIS LUXURY PARFUMS',
    reseller_name: 'MYTHOLIS LUXURY PARFUMS',

    billing_customer_name: (order.name || order.customerName || 'Patron').trim(),
    billing_last_name: '',
    billing_address: (order.address || order.shippingAddress || 'Armored Delivery Address').trim(),
    billing_address_2: '',
    billing_city: order.city || 'Mumbai',
    billing_pincode: String(order.pincode || '400001').trim(),
    billing_state: order.state || 'Maharashtra',
    billing_country: 'India',
    billing_email: order.userEmail || order.email || 'concierge@mytholis.com',
    billing_phone: String(order.phone || '9999999999').replace(/\D/g, '').slice(-10),
    shipping_is_billing: true,

    order_items: items.map(item => ({
      name: `Mytholis ${item.name || 'Extrait de Parfum'} (${item.size || 50}ml)`,
      sku: `MYTH-${(item.name || item.id || 'FLACON').toUpperCase().replace(/\s+/g, '-')}-${item.size || 50}ML`,
      units: Number(item.quantity || 1),
      selling_price: Number(item.price || 3999),
      discount: 0,
      tax: 0,
      hsn: 33030010 // HSN code for Luxury Perfumes & Scents
    })),

    payment_method: (order.paymentMethod || '').toUpperCase() === 'COD' ? 'COD' : 'Prepaid',
    sub_total: subtotal,
    length: config.length || 15,
    breadth: config.breadth || 15,
    height: config.height || 10,
    weight: config.weight || 0.5
  };
}

/**
 * Core PDF-Lib Rebranding Engine
 * Masks locked KYC company details and stamps luxury Mytholis typography & crest
 */
export async function rebrandLabelPdf(pdfData, options = {}) {
  // 1. Load PDF from ArrayBuffer, Uint8Array, or base64
  let pdfBytes;
  if (pdfData instanceof ArrayBuffer) {
    pdfBytes = new Uint8Array(pdfData);
  } else if (pdfData instanceof Uint8Array) {
    pdfBytes = pdfData;
  } else if (typeof pdfData === 'string') {
    if (pdfData.startsWith('data:')) {
      const base64 = pdfData.split(',')[1];
      const binaryString = atob(base64);
      pdfBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pdfBytes[i] = binaryString.charCodeAt(i);
      }
    } else {
      // Direct URL: fetch arrayBuffer
      const resp = await fetch(pdfData);
      const buf = await resp.arrayBuffer();
      pdfBytes = new Uint8Array(buf);
    }
  } else if (pdfData instanceof Blob) {
    const buf = await pdfData.arrayBuffer();
    pdfBytes = new Uint8Array(buf);
  } else {
    throw new Error('Unsupported PDF data format provided to rebrandShiprocketLabelPdf');
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 2. Fetch and embed Mytholis Crest Logo (graceful fallback)
  let logoImage = null;
  const showLogo = options.showLogo !== false;
  if (showLogo) {
    try {
      const logoUrl = options.logoUrl || '/logo.png';
      const logoResp = await fetch(logoUrl).catch(() => null);
      if (logoResp && logoResp.ok) {
        const logoBuf = await logoResp.arrayBuffer();
        logoImage = await pdfDoc.embedPng(logoBuf).catch(() => null);
      }
    } catch (logoErr) {
      console.warn('[Label Rebrander] Logo embed skipped:', logoErr.message);
    }
  }

  // 3. Coordinate Calibration
  const presetKey = options.preset || 'thermal-4x6-bottom';
  const preset = LABEL_PRESETS[presetKey] || LABEL_PRESETS['thermal-4x6-bottom'];

  const maskX = Number(options.maskX !== undefined ? options.maskX : preset.maskX);
  const maskY = Number(options.maskY !== undefined ? options.maskY : preset.maskY);
  const maskWidth = Number(options.maskWidth !== undefined ? options.maskWidth : preset.maskWidth);
  const maskHeight = Number(options.maskHeight !== undefined ? options.maskHeight : preset.maskHeight);
  const fontSize = Number(options.fontSize !== undefined ? options.fontSize : preset.fontSize);

  const brandTitle = options.brandTitle || 'MYTHOLIS LUXURY PARFUMS';
  const subtitle = options.subtitle || 'Extrait de Parfum | Luxury Olfactory House';
  const returnLine = options.returnLine || 'House of Mytholis • www.mytholis.com • concierge@mytholis.com';
  const originLine = options.originLine || 'Manufactured & Dispatched by Mytholis Parfumerie';

  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Zone 1: White-out rectangle over "Sold By / Shipped By" block
    page.drawRectangle({
      x: maskX,
      y: maskY,
      width: maskWidth,
      height: maskHeight,
      color: rgb(1, 1, 1), // Pure Opaque White
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 0.5
    });

    // Optional Zone 2: White-out rectangle over Top Header
    if (preset.hasTopHeaderMask || options.hasTopHeaderMask) {
      const topX = Number(options.topMaskX !== undefined ? options.topMaskX : preset.topMaskX);
      const topY = Number(options.topMaskY !== undefined ? options.topMaskY : preset.topMaskY);
      const topW = Number(options.topMaskWidth !== undefined ? options.topMaskWidth : preset.topMaskWidth);
      const topH = Number(options.topMaskHeight !== undefined ? options.topMaskHeight : preset.topMaskHeight);

      page.drawRectangle({
        x: topX,
        y: topY,
        width: topW,
        height: topH,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 0.5
      });

      page.drawText(brandTitle, {
        x: topX + 6,
        y: topY + topH - 14,
        size: fontSize + 1,
        font: helveticaBold,
        color: rgb(0.05, 0.05, 0.05)
      });

      page.drawText('Official Haute Parfumerie Consignment', {
        x: topX + 6,
        y: topY + 8,
        size: fontSize - 3,
        font: helvetica,
        color: rgb(0.25, 0.25, 0.25)
      });
    }

    // Embed Brand Crest Logo inside Zone 1 if available
    let textLeftMargin = maskX + 8;
    if (logoImage && showLogo) {
      const logoSize = Math.min(maskHeight - 16, 44);
      const logoX = maskX + maskWidth - logoSize - 8;
      const logoY = maskY + (maskHeight - logoSize) / 2;

      try {
        page.drawImage(logoImage, {
          x: logoX,
          y: logoY,
          width: logoSize,
          height: logoSize
        });
      } catch (_) {}
    }

    // Typography Layer: Crisp Thermal-Printable Black (#0C0C0C)
    // Line 1: Header / Return Label
    page.drawText('SOLD BY & RETURN DISPATCH TO:', {
      x: textLeftMargin,
      y: maskY + maskHeight - 13,
      size: Math.max(6, fontSize - 4),
      font: helveticaBold,
      color: rgb(0.35, 0.35, 0.35)
    });

    // Line 2: Brand Title (Bold, High Contrast)
    page.drawText(brandTitle, {
      x: textLeftMargin,
      y: maskY + maskHeight - 27,
      size: fontSize + 1,
      font: helveticaBold,
      color: rgb(0.05, 0.05, 0.05)
    });

    // Line 3: Subtitle / Scent Category
    page.drawText(subtitle, {
      x: textLeftMargin,
      y: maskY + maskHeight - 40,
      size: Math.max(6, fontSize - 2.5),
      font: helveticaBold,
      color: rgb(0.18, 0.18, 0.18)
    });

    // Line 4: Return Origin / Legal Note
    page.drawText(originLine, {
      x: textLeftMargin,
      y: maskY + maskHeight - 52,
      size: Math.max(5.5, fontSize - 3.5),
      font: helvetica,
      color: rgb(0.25, 0.25, 0.25)
    });

    // Line 5: Official Contact & Web Coordinates
    page.drawText(returnLine, {
      x: textLeftMargin,
      y: maskY + maskHeight - 64,
      size: Math.max(5.5, fontSize - 3.5),
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2)
    });
  }

  // 4. Save and return bytes + blob
  const modifiedBytes = await pdfDoc.save();
  const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  return {
    pdfDoc,
    pdfBytes: modifiedBytes,
    blob,
    blobUrl
  };
}

export const rebrandShiprocketLabelPdf = rebrandLabelPdf;

/**
 * Utility: Generate a realistic 4x6 Shiprocket courier label PDF for testing & calibration
 */
export async function generateSampleThermalLabelPdf() {
  const pdfDoc = await PDFDocument.create();
  // Standard 4x6 inches at 72 points per inch = 288 x 432 pt
  const page = pdfDoc.addPage([288, 432]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Outer border
  page.drawRectangle({
    x: 8,
    y: 8,
    width: 272,
    height: 416,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.5,
    color: rgb(1, 1, 1)
  });

  // Top Courier Banner: BlueDart Express & Hub Code
  page.drawText('BLUEDART EXPRESS', { x: 14, y: 405, size: 14, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('ROUTING: DEL / GGN / HUB-04', { x: 14, y: 390, size: 9, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('STANDARD SURFACE', { x: 175, y: 405, size: 8, font: fontRegular, color: rgb(0, 0, 0) });

  // Divider
  page.drawLine({ start: { x: 8, y: 382 }, end: { x: 280, y: 382 }, thickness: 1, color: rgb(0, 0, 0) });

  // AWB & Barcode Section
  page.drawText('AWB: 84920194821', { x: 14, y: 368, size: 11, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('ORDER #MYTH-8492', { x: 175, y: 368, size: 9, font: fontRegular, color: rgb(0, 0, 0) });

  // Simulate Vector Barcode lines (untouched zone)
  const barcodeY = 320;
  const barcodeHeight = 40;
  for (let x = 20; x < 268; x += 4) {
    const isThick = (x % 3 === 0);
    page.drawLine({
      start: { x, y: barcodeY },
      end: { x, y: barcodeY + barcodeHeight },
      thickness: isThick ? 2.5 : 1,
      color: rgb(0, 0, 0)
    });
  }

  // Divider
  page.drawLine({ start: { x: 8, y: 308 }, end: { x: 280, y: 308 }, thickness: 1, color: rgb(0, 0, 0) });

  // Destination / Deliver To Section
  page.drawText('DELIVER TO (PATRON):', { x: 14, y: 292, size: 8, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('AARAV VISHWANATHAN', { x: 14, y: 278, size: 10, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Villa 42, The Palms Sovereign Enclave', { x: 14, y: 264, size: 8.5, font: fontRegular, color: rgb(0, 0, 0) });
  page.drawText('Golf Course Road, DLF Phase 5', { x: 14, y: 252, size: 8.5, font: fontRegular, color: rgb(0, 0, 0) });
  page.drawText('GURGAON, HARYANA - 122002', { x: 14, y: 238, size: 9, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Phone: +91 98765 43210', { x: 14, y: 226, size: 8.5, font: fontRegular, color: rgb(0, 0, 0) });

  // COD Collectible Box
  page.drawRectangle({
    x: 180,
    y: 230,
    width: 95,
    height: 65,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
    color: rgb(0.96, 0.96, 0.96)
  });
  page.drawText('COD COLLECTIBLE', { x: 186, y: 282, size: 7.5, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Rs. 18,500', { x: 186, y: 260, size: 13, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('PETRALUX (50ml)', { x: 186, y: 242, size: 7, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  // Divider above Return / Sold By
  page.drawLine({ start: { x: 8, y: 110 }, end: { x: 280, y: 110 }, thickness: 1, color: rgb(0, 0, 0) });

  // Bottom "Sold By" Box (The Locked KYC entity that needs rebranding)
  page.drawText('SOLD BY / RETURN ADDRESS:', { x: 14, y: 96, size: 7.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('OLD_LOCKED_KYC_LEGAL_ENTITY_PVT_LTD', { x: 14, y: 82, size: 8.5, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('GSTIN: 07AAACH0000A1Z5 | CIN: U74999DL2021PTC123456', { x: 14, y: 70, size: 7, font: fontRegular, color: rgb(0, 0, 0) });
  page.drawText('Shed 12B, Industrial Area Ph 1, Okhla, New Delhi 110020', { x: 14, y: 58, size: 7, font: fontRegular, color: rgb(0, 0, 0) });
  page.drawText('Return Care: returns@courier-logistics-hub.in', { x: 14, y: 46, size: 7, font: fontRegular, color: rgb(0, 0, 0) });
  page.drawText('Authorized Shiprocket Merchant Dispatch Hub', { x: 14, y: 34, size: 6.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  return await pdfDoc.save();
}

/**
 * Utility: Trigger browser download for a PDF Blob
 */
export function downloadPdfBlob(blob, filename = 'MYTHOLIS-Shipping-Label.pdf') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Utility: Open direct browser print dialog for a PDF Blob
 */
export function printPdfBlob(blobUrl) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;

  document.body.appendChild(iframe);
  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      // Fallback: Open in new window if iframe print blocked
      window.open(blobUrl, '_blank');
    }
  };
}
