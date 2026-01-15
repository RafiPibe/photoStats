import { useEffect, useMemo, useRef, useState } from 'react';
import * as exifr from 'exifr';
import LibRaw from 'libraw-wasm';
import { normalizeString, parseExif, toNumber } from './utils/exif';
import Hero from './components/Hero';
import FileUpload from './components/FileUpload';
import PhotoForm from './components/PhotoForm';
import Preview from './components/Preview';
import Footer from './components/Footer';

const DEFAULT_FORM = {
  cameraName: '',
  brandChoice: 'none',
  brandCustom: '',
  lensChoice: '',
  lensCustom: '',
  aperture: '',
  shutterSpeed: '',
  focalLength: '',
  iso: '',
  orientation: 'portrait',
};

const BRAND_MATCHERS = [
  { pattern: /apple|iphone/i, label: 'Apple' },
  { pattern: /sony|ilce|dsc|nex/i, label: 'Sony' },
  { pattern: /canon/i, label: 'Canon' },
  { pattern: /nikon/i, label: 'Nikon' },
  { pattern: /fujifilm|fuji/i, label: 'Fujifilm' },
  { pattern: /leica/i, label: 'Leica' },
  { pattern: /panasonic|lumix/i, label: 'Lumix' },
  { pattern: /DG|DN|ART|sigma/i, label: 'Sigma' },
  { pattern: /zeiss/i, label: 'Zeiss' },
  { pattern: /olympus|om system|omds/i, label: 'Olympus' },
  { pattern: /pentax/i, label: 'Pentax' },
  { pattern: /ricoh|gr/i, label: 'Ricoh' },
  { pattern: /hasselblad/i, label: 'Hasselblad' },
  { pattern: /dji/i, label: 'DJI' },
  { pattern: /gopro/i, label: 'GoPro' },
  { pattern: /google|pixel/i, label: 'Google' },
  { pattern: /samsung|galaxy/i, label: 'Samsung' },
  { pattern: /xiaomi/i, label: 'Xiaomi' },
  { pattern: /huawei/i, label: 'Huawei' },
  { pattern: /minolta/i, label: 'Minolta' },
  { pattern: /tamron/i, label: 'Tamron' },
  { pattern: /laowa/i, label: 'Laowa' },
  { pattern: /samyang/i, label: 'Samyang' },
  { pattern: /ttartisan/i, label: 'TTArtisan' },
  { pattern: /7artisans?/i, label: '7Artisans' },
  { pattern: /viltrox/i, label: 'Viltrox' },
];

const FONT_FAMILY = '"Plus Jakarta Sans", sans-serif';
const TEXT_COLOR = '#191611';
const PANEL_RATIO = 238 / 1080;
const BRAND_OPTIONS = Array.from(
  new Set(BRAND_MATCHERS.map((matcher) => matcher.label))
);
const LOGO_SCALES = {
  Apple: 1.45,
  Leica: 1.4,
  Minolta: 1.3,
  Nikon: 1.3,
  Zeiss: 1.35,
  Xiaomi: 1.3,
};
const BRAND_LOGOS = {
  '7Artisans': '/logos/7artisans.svg',
  Apple: '/logos/Apple.svg',
  Canon: '/logos/Canon.svg',
  DJI: '/logos/DJI.svg',
  Fujifilm: '/logos/Fujifilm.svg',
  Google: '/logos/Google.svg',
  GoPro: '/logos/Gopro.svg',
  Hasselblad: '/logos/Hasselblad.svg',
  Huawei: '/logos/Huawei.svg',
  Laowa: '/logos/Laowa.svg',
  Leica: '/logos/Leica.svg',
  Lumix: '/logos/Lumix.svg',
  Minolta: '/logos/Minolta.svg',
  Nikon: '/logos/Nikon.svg',
  Olympus: '/logos/Olympus.svg',
  Pentax: '/logos/Pentax.svg',
  Ricoh: '/logos/Ricoh.svg',
  Samsung: '/logos/Samsung.svg',
  Samyang: '/logos/Samyang.png',
  Sigma: '/logos/Sigma.svg',
  Sony: '/logos/Sony.svg',
  TTArtisan: '/logos/TTArtisan.svg',
  Tamron: '/logos/Tamron.svg',
  Zeiss: '/logos/Zeiss.svg',
  Xiaomi: '/logos/xiaomi.svg',
  Viltrox: '/logos/viltrox.svg',
};
const LENS_OPTIONS = Object.keys(BRAND_LOGOS);
const FILE_ACCEPT =
  'image/*,.raw,.RAW,.arw,.ARW,.dng,.DNG,.nef,.NEF,.cr2,.CR2,.cr3,.CR3,.orf,.ORF,.raf,.RAF,.rw2,.RW2,.pef,.PEF,.heic,.HEIC,.heif,.HEIF';
const RAW_EXTENSIONS = new Set([
  'raw',
  'arw',
  'dng',
  'nef',
  'cr2',
  'cr3',
  'orf',
  'raf',
  'rw2',
  'pef',
]);
const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'tif',
  'tiff',
  'heic',
  'heif',
]);
const EXIFR_OPTIONS = {
  tiff: true,
  ifd0: true,
  exif: true,
};

function detectBrand(input) {
  const text = normalizeString(input);
  if (!text) {
    return '';
  }
  const match = BRAND_MATCHERS.find((item) => item.pattern.test(text));
  return match ? match.label : '';
}

function getLogoSrc(name) {
  const normalized = normalizeString(name);
  if (!normalized) {
    return '';
  }
  const key = Object.keys(BRAND_LOGOS).find(
    (brand) => brand.toLowerCase() === normalized.toLowerCase()
  );
  return key ? BRAND_LOGOS[key] : '';
}

function getBrandDisplay(brandChoice, brandCustom) {
  if (brandChoice === 'none' || brandChoice === '') {
    return '';
  }
  if (brandChoice === 'other') {
    return brandCustom;
  }
  return brandChoice;
}

function getLensDisplay(lensChoice, lensCustom) {
  if (lensChoice === 'other') {
    return lensCustom;
  }
  return lensChoice;
}

function resolveBrandState(brandText) {
  const normalized = normalizeString(brandText);
  if (!normalized) {
    return { brandChoice: 'none', brandCustom: '' };
  }
  const matched = BRAND_OPTIONS.find(
    (option) => option.toLowerCase() === normalized.toLowerCase()
  );
  if (matched) {
    return { brandChoice: matched, brandCustom: '' };
  }
  const detected = detectBrand(normalized);
  if (detected && BRAND_OPTIONS.includes(detected)) {
    return { brandChoice: detected, brandCustom: '' };
  }
  return { brandChoice: 'other', brandCustom: normalized };
}

function resolveLensState(lensText) {
  const normalized = normalizeString(lensText);
  if (!normalized) {
    return { lensChoice: '', lensCustom: '' };
  }
  const lower = normalized.toLowerCase();
  const matched = LENS_OPTIONS.find((option) =>
    lower.includes(option.toLowerCase())
  );
  if (matched) {
    return { lensChoice: matched, lensCustom: '' };
  }
  const detected = detectBrand(normalized);
  if (detected && LENS_OPTIONS.includes(detected)) {
    return { lensChoice: detected, lensCustom: '' };
  }
  return { lensChoice: 'other', lensCustom: normalized };
}

function normalizeExifTags(exif) {
  if (!exif) {
    return {};
  }
  return {
    Make: exif.Make ?? exif.make ?? exif.camera_make ?? exif.cameraMake ?? '',
    Model: exif.Model ?? exif.model ?? exif.camera_model ?? exif.cameraModel ?? '',
    LensModel:
      exif.LensModel ??
      exif.Lens ??
      exif.lens ??
      exif.lens_model ??
      exif.lensModel ??
      exif.LensID ??
      '',
    LensMake: exif.LensMake ?? exif.lens_make ?? exif.lensMake ?? '',
    ISOSpeedRatings:
      exif.ISOSpeedRatings ??
      exif.ISO ??
      exif.ISOValue ??
      exif.ISOSpeed ??
      exif.iso_speed ??
      exif.iso ??
      '',
    PhotographicSensitivity: exif.PhotographicSensitivity ?? '',
    FNumber:
      exif.FNumber ??
      exif.ApertureValue ??
      exif.Aperture ??
      exif.aperture ??
      exif.aperture_value ??
      '',
    ExposureTime:
      exif.ExposureTime ??
      exif.ShutterSpeedValue ??
      exif.ShutterSpeed ??
      exif.shutter ??
      exif.shutter_speed ??
      exif.exposure_time ??
      '',
    FocalLength:
      exif.FocalLength ??
      exif.FocalLengthIn35mmFormat ??
      exif.FocalLengthIn35mmFilm ??
      exif.focal_len ??
      exif.focal_length ??
      '',
  };
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = url;
  });
}

function getMetadataDimensions(meta) {
  const pairs = [
    [meta?.width, meta?.height],
    [meta?.image_width, meta?.image_height],
    [meta?.imageWidth, meta?.imageHeight],
    [meta?.sizes?.width, meta?.sizes?.height],
    [meta?.sizes?.iwidth, meta?.sizes?.iheight],
    [meta?.sizes?.raw_width, meta?.sizes?.raw_height],
    [meta?.raw_width, meta?.raw_height],
    [meta?.rawWidth, meta?.rawHeight],
  ];
  for (const [width, height] of pairs) {
    const safeWidth = Number(width);
    const safeHeight = Number(height);
    if (safeWidth > 0 && safeHeight > 0) {
      return { width: safeWidth, height: safeHeight };
    }
  }
  return { width: 0, height: 0 };
}

function normalizeRawImageData(decoded, meta) {
  if (!decoded) {
    return null;
  }
  let data =
    decoded.data ??
    decoded.pixels ??
    decoded.imageData ??
    decoded.image ??
    decoded;
  if (data?.data) {
    data = data.data;
  }
  if (data instanceof ArrayBuffer) {
    data = new Uint8Array(data);
  }
  if (Array.isArray(data)) {
    data = Uint8Array.from(data);
  }
  const width =
    decoded.width ?? decoded.imageWidth ?? decoded.w ?? decoded.cols ?? null;
  const height =
    decoded.height ?? decoded.imageHeight ?? decoded.h ?? decoded.rows ?? null;
  const metaDimensions = getMetadataDimensions(meta);
  const finalWidth = Number(width) || metaDimensions.width;
  const finalHeight = Number(height) || metaDimensions.height;
  if (!data || !finalWidth || !finalHeight) {
    return null;
  }
  return {
    data,
    width: finalWidth,
    height: finalHeight,
  };
}

function buildRgbaBuffer(data, width, height) {
  const pixelCount = width * height;
  if (!pixelCount || !data) {
    return null;
  }
  const rgba = new Uint8ClampedArray(pixelCount * 4);
  if (data.length >= pixelCount * 4) {
    rgba.set(data.subarray(0, pixelCount * 4));
    return rgba;
  }
  if (data.length >= pixelCount * 3) {
    for (let i = 0; i < pixelCount; i += 1) {
      const dataIndex = i * 3;
      const rgbaIndex = i * 4;
      rgba[rgbaIndex] = data[dataIndex];
      rgba[rgbaIndex + 1] = data[dataIndex + 1];
      rgba[rgbaIndex + 2] = data[dataIndex + 2];
      rgba[rgbaIndex + 3] = 255;
    }
    return rgba;
  }
  return null;
}

async function decodeRawFile(file) {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const raw = new LibRaw();
  await raw.open(buffer, {
    outputBps: 8,
    outputColor: 1,
    useCameraWb: true,
    noAutoBright: true,
  });
  const metadata = await raw.metadata(true);
  const decoded = await raw.imageData();
  const normalized = normalizeRawImageData(decoded, metadata);
  const exif = normalizeExifTags(metadata);
  if (!normalized) {
    return { image: null, previewUrl: '', exif };
  }
  const rgba = buildRgbaBuffer(normalized.data, normalized.width, normalized.height);
  if (!rgba) {
    return { image: null, previewUrl: '', exif };
  }
  const canvas = document.createElement('canvas');
  canvas.width = normalized.width;
  canvas.height = normalized.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { image: null, previewUrl: '', exif };
  }
  ctx.putImageData(new ImageData(rgba, normalized.width, normalized.height), 0, 0);
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  );
  if (!blob) {
    return { image: null, previewUrl: '', exif };
  }
  const previewUrl = URL.createObjectURL(blob);
  const image = await loadImageFromUrl(previewUrl);
  return { image, previewUrl, exif };
}

function formatNumber(value) {
  if (value == null || Number.isNaN(value)) {
    return '';
  }
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
}

function formatAperture(value) {
  if (!value) {
    return '-';
  }
  const raw = String(value).trim();
  const clean = raw.replace(/^f/i, '');
  return `f${clean}`;
}

function formatExposure(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    if (trimmed.includes('/')) {
      return trimmed;
    }
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return formatExposure(numeric);
    }
    return trimmed;
  }
  if (typeof value === 'object' && value.numerator != null) {
    const { numerator, denominator } = value;
    if (!denominator) {
      return '';
    }
    if (numerator === 1) {
      return `1/${denominator}`;
    }
    const ratio = numerator / denominator;
    if (ratio < 1) {
      return `1/${Math.round(1 / ratio)}`;
    }
    return formatNumber(ratio);
  }
  const numeric = toNumber(value);
  if (numeric == null) {
    return '';
  }
  if (numeric < 1) {
    return `1/${Math.round(1 / numeric)}`;
  }
  return formatNumber(numeric);
}

function formatFocalLength(value) {
  if (!value) {
    return '';
  }
  const cleaned = String(value).replace(/mm/i, '').trim();
  return cleaned;
}

function deriveCameraName(make, model) {
  if (make && model) {
    const lowerModel = model.toLowerCase();
    if (lowerModel.includes(make.toLowerCase())) {
      return model;
    }
    return `${make} ${model}`.trim();
  }
  return model || make || '';
}

function buildFormFromExif(exif, orientation) {
  const make = normalizeString(exif.Make);
  const model = normalizeString(exif.Model);
  const cameraName = deriveCameraName(make, model);
  const lensModel = normalizeString(exif.LensModel);
  const lensMake = normalizeString(exif.LensMake);
  const brandState = resolveBrandState(make || cameraName);
  const isoValue = normalizeString(
    exif.ISOSpeedRatings || exif.PhotographicSensitivity
  );

  const aperture = formatNumber(toNumber(exif.FNumber));
  const shutterSpeed = formatExposure(exif.ExposureTime);
  const focalLength = formatNumber(toNumber(exif.FocalLength));
  const lensState = resolveLensState(lensModel || lensMake);

  return {
    cameraName,
    ...brandState,
    ...lensState,
    aperture,
    shutterSpeed,
    focalLength,
    iso: isoValue,
    orientation,
  };
}

function getLayout(imageInfo, orientation) {
  if (!imageInfo.width || !imageInfo.height) {
    return null;
  }
  const portraitPanelSize = Math.round(imageInfo.width * PANEL_RATIO);
  const landscapePanelSize = Math.round(imageInfo.height * PANEL_RATIO);
  const panelSize =
    orientation === 'landscape' ? landscapePanelSize : portraitPanelSize;
  if (orientation === 'landscape') {
    return {
      canvasWidth: imageInfo.width + panelSize,
      canvasHeight: imageInfo.height,
      panelSize,
    };
  }
  return {
    canvasWidth: imageInfo.width,
    canvasHeight: imageInfo.height + panelSize,
    panelSize,
  };
}

function drawFittedText(ctx, text, x, y, maxWidth, baseSize, weight) {
  let size = baseSize;
  const content = text || '';
  ctx.font = `${weight} ${size}px ${FONT_FAMILY}`;
  while (ctx.measureText(content).width > maxWidth && size > 8) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${FONT_FAMILY}`;
  }
  ctx.fillText(content, x, y);
  return size;
}

function measureStatWidth(ctx, stat, numberSize, labelSize) {
  ctx.font = `500 ${numberSize}px ${FONT_FAMILY}`;
  const numberWidth = ctx.measureText(stat.value || '').width;
  ctx.font = `300 ${labelSize}px ${FONT_FAMILY}`;
  const labelWidth = ctx.measureText(stat.label || '').width;
  return Math.max(numberWidth, labelWidth);
}

function getLogoScale(name) {
  const normalized = normalizeString(name).toLowerCase();
  if (!normalized) {
    return 1;
  }
  const key = Object.keys(LOGO_SCALES).find(
    (brand) => brand.toLowerCase() === normalized
  );
  return key ? LOGO_SCALES[key] : 1;
}

function getLogoDimensions(image, targetHeight, scale = 1) {
  const sourceWidth = image?.naturalWidth || image?.width || 0;
  const sourceHeight = image?.naturalHeight || image?.height || 0;
  if (!sourceWidth || !sourceHeight) {
    return { width: 0, height: 0 };
  }
  const height = targetHeight * scale;
  const ratio = height / sourceHeight;
  return { width: sourceWidth * ratio, height };
}

function getTextWidth(ctx, text, size, weight) {
  if (!text) {
    return 0;
  }
  ctx.font = `${weight} ${size}px ${FONT_FAMILY}`;
  return ctx.measureText(text).width;
}

function drawBrandLensLine({
  ctx,
  x,
  y,
  align,
  brandText,
  lensText,
  brandLogo,
  lensLogo,
  fontSize,
  logoHeight,
  gap,
}) {
  const hasBrandText = Boolean(brandText);
  const hasLensText = Boolean(lensText);
  const brandScale = getLogoScale(brandText);
  const lensScale = getLogoScale(lensText);
  const brandLogoSize = brandLogo
    ? getLogoDimensions(brandLogo, logoHeight, brandScale)
    : null;
  const lensLogoSize = lensLogo
    ? getLogoDimensions(lensLogo, logoHeight, lensScale)
    : null;
  const useBrandLogo = brandLogoSize?.width;
  const useLensLogo = lensLogoSize?.width;
  const showBrand = useBrandLogo || hasBrandText;
  const showLens = useLensLogo || hasLensText;
  const showPipe = showBrand && showLens;
  const brandWidth = useBrandLogo
    ? brandLogoSize.width
    : getTextWidth(ctx, brandText, fontSize, 600);
  const lensWidth = useLensLogo
    ? lensLogoSize.width
    : getTextWidth(ctx, lensText, fontSize, 600);
  const dividerWidth = showPipe ? fontSize * 0.7 : 0;
  const totalWidth =
    brandWidth + lensWidth + (showPipe ? gap * 2 + dividerWidth : 0);
  let cursorX = align === 'right' ? x - totalWidth : x;
  const dividerHeight = Math.max(logoHeight * 0.9, fontSize * 1.3);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 ${fontSize}px ${FONT_FAMILY}`;

  if (showBrand) {
    if (useBrandLogo) {
      ctx.drawImage(
        brandLogo,
        cursorX,
        y - brandLogoSize.height,
        brandLogoSize.width,
        brandLogoSize.height
      );
    } else {
      ctx.fillText(brandText, cursorX, y);
    }
    cursorX += brandWidth;
  }

  if (showPipe) {
    cursorX += gap;
    ctx.save();
    ctx.lineWidth = Math.max(1, fontSize * 0.12);
    ctx.strokeStyle = TEXT_COLOR;
    const dividerX = cursorX + dividerWidth / 2;
    const dividerBottom = y - dividerHeight * 0.05;
    ctx.beginPath();
    ctx.moveTo(dividerX, dividerBottom - dividerHeight);
    ctx.lineTo(dividerX, dividerBottom);
    ctx.stroke();
    ctx.restore();
    cursorX += dividerWidth + gap;
  }

  if (showLens) {
    if (useLensLogo) {
      ctx.drawImage(
        lensLogo,
        cursorX,
        y - lensLogoSize.height,
        lensLogoSize.width,
        lensLogoSize.height
      );
    } else {
      ctx.fillText(lensText, cursorX, y);
    }
  }
}

function drawBrandLensStack({
  ctx,
  x,
  y,
  brandText,
  lensText,
  brandLogo,
  lensLogo,
  fontSize,
  logoHeight,
  lineGap,
}) {
  const brandScale = getLogoScale(brandText);
  const lensScale = getLogoScale(lensText);
  const brandLogoSize = brandLogo
    ? getLogoDimensions(brandLogo, logoHeight, brandScale)
    : null;
  const lensLogoSize = lensLogo
    ? getLogoDimensions(lensLogo, logoHeight, lensScale)
    : null;
  const lensLineHeight = lensLogoSize?.height || (lensText ? fontSize : 0);
  const hasBrandLine = Boolean(brandText) || Boolean(brandLogoSize?.width);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 ${fontSize}px ${FONT_FAMILY}`;

  if (hasBrandLine) {
    if (brandLogoSize?.width) {
      ctx.drawImage(
        brandLogo,
        x,
        y - brandLogoSize.height,
        brandLogoSize.width,
        brandLogoSize.height
      );
    } else {
      ctx.fillText(brandText, x, y);
    }
  }

  if (lensText || lensLogoSize?.width) {
    const lensBaseline = hasBrandLine ? y + lineGap + lensLineHeight : y;
    if (lensLogoSize?.width) {
      ctx.drawImage(
        lensLogo,
        x,
        lensBaseline - lensLogoSize.height,
        lensLogoSize.width,
        lensLogoSize.height
      );
    } else {
      ctx.fillText(lensText, x, lensBaseline);
    }
  }
}

function drawPortrait(ctx, imageInfo, layout, displayData, brandLogo, lensLogo) {
  const { height } = imageInfo;
  const { canvasWidth, panelSize } = layout;
  const panelTop = height;
  const panelPadding = Math.round(panelSize * 0.12);
  const footerPadding = Math.round(panelSize * 0.18);
  const scale = panelSize / 238;
  const infoGap = Math.round(27 * scale);
  const infoSpacing = Math.round(123 * scale);
  const numberSize = Math.round(36 * scale);
  const labelSize = Math.round(13 * scale);
  const labelGap = Math.round(8 * scale);
  const infoToFooterGap = Math.round(103 * scale);
  const cameraSize = Math.round(16 * scale);
  const brandSize = Math.round(18 * scale);
  const brandGap = Math.round(12 * scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, panelTop, canvasWidth, panelSize);
  ctx.fillStyle = TEXT_COLOR;

  const stats = displayData.stats;
  const statWidths = stats.map((stat) =>
    measureStatWidth(ctx, stat, numberSize, labelSize)
  );
  const totalWidth =
    statWidths.reduce((sum, value) => sum + value, 0) +
    infoSpacing * (stats.length - 1);
  let currentX = (canvasWidth - totalWidth) / 2;
  const statsTop = Math.round(panelTop + infoGap);
  const numberBaseline = Math.round(statsTop + numberSize);
  const labelBaseline = Math.round(numberBaseline + labelGap + labelSize);

  stats.forEach((stat, index) => {
    const statWidth = statWidths[index];
    const centerX = currentX + statWidth / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `500 ${numberSize}px ${FONT_FAMILY}`;
    ctx.fillText(stat.value, centerX, numberBaseline);
    ctx.font = `300 ${labelSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = '#4b463e';
    ctx.fillText(stat.label, centerX, labelBaseline);
    ctx.fillStyle = TEXT_COLOR;
    currentX += statWidth + infoSpacing;
  });

  const footerY = Math.round(labelBaseline + infoToFooterGap);
  ctx.textAlign = 'left';
  drawFittedText(
    ctx,
    displayData.cameraName,
    footerPadding,
    footerY,
    canvasWidth * 0.55,
    cameraSize,
    200
  );

  drawBrandLensLine({
    ctx,
    x: canvasWidth - footerPadding,
    y: footerY,
    align: 'right',
    brandText: displayData.brandText,
    lensText: displayData.lensText,
    brandLogo,
    lensLogo,
    fontSize: brandSize,
    logoHeight: brandSize * 1.25,
    gap: brandGap,
  });
}

function drawLandscape(ctx, imageInfo, layout, displayData, brandLogo, lensLogo) {
  const { width, height } = imageInfo;
  const { panelSize } = layout;
  const panelLeft = width;
  const panelPadding = Math.round(panelSize * 0.12);
  const footerPadding = Math.round(panelSize * 0.18);
  const scale = panelSize / 238;
  const infoTop = Math.round(125 * scale);
  const infoSpacing = Math.round(123 * scale);
  const infoToFooterGap = Math.round(211 * scale);
  const nameToBrandGap = Math.round(32 * scale);
  const numberSize = Math.round(36 * scale);
  const labelSize = Math.round(13 * scale);
  const labelGap = Math.round(8 * scale);
  const cameraSize = Math.round(16 * scale);
  const brandSize = Math.round(18 * scale);
  const lensLineGap = Math.round(14 * scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(panelLeft, 0, panelSize, height);
  ctx.fillStyle = TEXT_COLOR;

  const stats = displayData.stats;
  const labelBaselineOffset = labelGap + labelSize;

  stats.forEach((stat, index) => {
    const numberBaseline = Math.round(
      infoTop + numberSize + index * infoSpacing
    );
    const labelBaseline = Math.round(numberBaseline + labelBaselineOffset);
    const textX = Math.round(panelLeft + panelPadding);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `500 ${numberSize}px ${FONT_FAMILY}`;
    ctx.fillText(stat.value, textX, numberBaseline);
    ctx.font = `300 ${labelSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = '#4b463e';
    ctx.fillText(stat.label, textX, labelBaseline);
    ctx.fillStyle = TEXT_COLOR;
  });

  const lastLabelBaseline = Math.round(
    infoTop +
    numberSize +
    (stats.length - 1) * infoSpacing +
    labelBaselineOffset
  );
  const cameraBaseline = Math.round(lastLabelBaseline + infoToFooterGap);
  const brandBaseline = Math.round(cameraBaseline + nameToBrandGap + brandSize);
  ctx.textAlign = 'left';
  drawFittedText(
    ctx,
    displayData.cameraName,
    Math.round(panelLeft + footerPadding),
    cameraBaseline,
    Math.round(panelSize - footerPadding * 2),
    cameraSize,
    200
  );
  drawBrandLensStack({
    ctx,
    x: Math.round(panelLeft + footerPadding),
    y: brandBaseline,
    brandText: displayData.brandText,
    lensText: displayData.lensText,
    brandLogo,
    lensLogo,
    fontSize: brandSize,
    logoHeight: brandSize * 1.25,
    lineGap: lensLineGap,
  });
}

function App() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [autoForm, setAutoForm] = useState(DEFAULT_FORM);
  const [imageUrl, setImageUrl] = useState('');
  const [imageInfo, setImageInfo] = useState({ width: 0, height: 0 });
  const [status, setStatus] = useState('Upload a photo to start.');
  const [fileName, setFileName] = useState('');
  const [fontsReady, setFontsReady] = useState(false);
  const [brandLogo, setBrandLogo] = useState(null);
  const [lensLogo, setLensLogo] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const logoCache = useRef(new Map());

  useEffect(() => {
    if (!document.fonts) {
      setFontsReady(true);
      return;
    }
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const layout = useMemo(
    () => getLayout(imageInfo, form.orientation),
    [imageInfo, form.orientation]
  );

  const displayData = useMemo(() => {
    const cameraName = form.cameraName || 'Camera name';
    const lens = getLensDisplay(form.lensChoice, form.lensCustom);
    const hasExplicitNone = form.brandChoice === 'none';
    const brandFromForm = getBrandDisplay(form.brandChoice, form.brandCustom);
    const detectedBrand = hasExplicitNone ? '' : detectBrand(form.cameraName);
    const brandKey = brandFromForm || detectedBrand || '';
    const brandDisplay = hasExplicitNone ? '' : brandKey || (lens ? '' : 'Brand');
    
    // If brand and lens are the same, only show brand (e.g. "Apple" instead of "Apple | Apple")
    const finalLensText = brandDisplay && lens && 
      brandDisplay.toLowerCase() === lens.toLowerCase() ? '' : lens;
    
    return {
      cameraName,
      brandText: brandDisplay,
      brandKey,
      lensText: finalLensText,
      stats: [
        { value: formatAperture(form.aperture), label: 'f' },
        { value: formatExposure(form.shutterSpeed) || '-', label: 'shutter speed' },
        { value: formatFocalLength(form.focalLength) || '-', label: 'mm' },
        { value: form.iso || '-', label: 'ISO' },
      ],
    };
  }, [form]);

  useEffect(() => {
    let active = true;

    const loadLogo = (logoSrc, setter) => {
      if (!logoSrc) {
        setter(null);
        return;
      }
      if (logoCache.current.has(logoSrc)) {
        setter(logoCache.current.get(logoSrc));
        return;
      }
      const image = new Image();
      image.onload = () => {
        if (!active) {
          return;
        }
        logoCache.current.set(logoSrc, image);
        setter(image);
      };
      image.onerror = () => {
        if (active) {
          setter(null);
        }
      };
      image.src = logoSrc;
    };

    loadLogo(getLogoSrc(displayData.brandKey), setBrandLogo);
    loadLogo(getLogoSrc(displayData.lensText), setLensLogo);

    return () => {
      active = false;
    };
  }, [displayData.brandKey, displayData.lensText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !layout || !fontsReady) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    canvas.width = layout.canvasWidth;
    canvas.height = layout.canvasHeight;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, layout.canvasWidth, layout.canvasHeight);
    ctx.drawImage(image, 0, 0, imageInfo.width, imageInfo.height);

    if (form.orientation === 'landscape') {
      drawLandscape(ctx, imageInfo, layout, displayData, brandLogo, lensLogo);
    } else {
      drawPortrait(ctx, imageInfo, layout, displayData, brandLogo, lensLogo);
    }
  }, [brandLogo, displayData, fontsReady, form.orientation, imageInfo, layout, lensLogo]);

  const handleFileChange = async (event) => {
    const [file] = event.target.files;
    if (!file) {
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isRaw = RAW_EXTENSIONS.has(extension);
    const isImage =
      !isRaw &&
      (file.type.startsWith('image/') || IMAGE_EXTENSIONS.has(extension));
    setStatus(
      isRaw
        ? 'Decoding RAW in the browser. This can take a moment...'
        : isImage
          ? 'Loading image and metadata...'
          : 'Loading file metadata...'
    );
    setFileName(file.name);
    setImageUrl('');

    let previewUrl = '';
    try {
      let exif = {};
      let image = null;

      if (isRaw) {
        const decoded = await decodeRawFile(file);
        exif = decoded.exif;
        image = decoded.image;
        previewUrl = decoded.previewUrl;
      } else {
        const parsed = await exifr.parse(file, EXIFR_OPTIONS).catch(() => null);
        if (parsed) {
          exif = normalizeExifTags(parsed);
        } else {
          const buffer = await file.arrayBuffer();
          exif = normalizeExifTags(parseExif(buffer));
        }
        if (isImage) {
          previewUrl = URL.createObjectURL(file);
          image = await loadImageFromUrl(previewUrl);
        }
      }
      const orientation = form.orientation || 'portrait';
      const derived = buildFormFromExif(exif, orientation);

      if (image) {
        imageRef.current = image;
        setImageInfo({ width: image.width, height: image.height });
        setImageUrl(previewUrl);
      } else {
        imageRef.current = null;
        setImageInfo({ width: 0, height: 0 });
        setImageUrl('');
      }
      setAutoForm(derived);
      setForm(derived);
      const hasExif = Object.keys(exif).length > 0;
      if (isRaw) {
        setStatus(
          hasExif
            ? image
              ? 'RAW decoded at full resolution. Update fields if needed.'
              : 'RAW metadata pulled, but decode failed. Try a JPG/PNG.'
            : 'RAW metadata not found. Try a JPG/PNG.'
        );
        return;
      }
      setStatus(
        hasExif
          ? image
            ? 'Metadata pulled from EXIF. Update the fields if needed.'
            : 'Metadata pulled from EXIF. Preview not available for this file type.'
          : image
            ? 'No EXIF metadata found. Fill the fields manually.'
            : 'No EXIF metadata found. Preview not available for this file type.'
      );
    } catch (error) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      imageRef.current = null;
      setImageInfo({ width: 0, height: 0 });
      setImageUrl('');
      setStatus('Could not load the file. Please try another format.');
    }
  };

  const handleReset = () => {
    setForm(autoForm);
  };
  const handleDownload = () => {
    if (!canvasRef.current) {
      return;
    }

    const safeName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'photo';
    const downloadFileName = `${safeName}-photostats.png`;

    // Detect if we're on iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS || isSafari) {
      // For iOS/Safari: Open image in new tab for user to save manually
      const dataURL = canvasRef.current.toDataURL('image/png');
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${downloadFileName}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { margin: 0; padding: 20px; background: #000; display: flex; flex-direction: column; align-items: center; }
                img { max-width: 100%; height: auto; }
                p { color: #fff; font-family: system-ui; text-align: center; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <p>Long press the image below and select "Save Image" or "Add to Photos"</p>
              <img src="${dataURL}" alt="${downloadFileName}" />
            </body>
          </html>
        `);
      }
    } else {
      // For desktop and Android: Use blob download
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = downloadFileName;
          link.href = url;
          link.style.display = 'none';

          document.body.appendChild(link);
          link.click();

          // Cleanup
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 100);
        }
      }, 'image/png');
    }
  };

  return (
    <>
      <Hero />

      <main id="upload" className="relative px-6 py-20 max-w-7xl mx-auto">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <button
            onClick={handleDownload}
            disabled={!imageUrl}
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-dark text-white font-semibold shadow-lg hover:shadow-xl transition-shadow duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            type="button"
            aria-label="Download PNG of photo with EXIF overlay"
          >
            Download PNG
          </button>
          <button
            onClick={handleReset}
            disabled={!imageUrl}
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-white text-dark font-semibold border border-cream-300 hover:border-cream-400 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            type="button"
            aria-label="Reset form to original EXIF data"
          >
            Reset to EXIF
          </button>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Left Panel - Scrollable Content */}
          <div className="flex flex-col gap-6">
            <FileUpload
              onFileChange={handleFileChange}
              accept={FILE_ACCEPT}
              currentFile={fileName ? { name: fileName } : null}
            />

            {imageUrl && (
              <div className="rounded-3xl overflow-hidden border border-cream-300 bg-cream-50 min-h-[200px] flex items-center justify-center">
                <img src={imageUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
              </div>
            )}

            {!imageUrl && (
              <div className="rounded-3xl border border-cream-300 bg-cream-50 min-h-[200px] flex items-center justify-center text-cream-700 text-sm">
                No image loaded
              </div>
            )}

            <div className="self-start px-4 py-2 rounded-full bg-cream-200 text-sm text-cream-800">
              {status}
            </div>

            <PhotoForm
              form={form}
              brandOptions={BRAND_OPTIONS}
              lensOptions={LENS_OPTIONS}
              onChange={(field, value) => setForm(prev => ({ ...prev, [field]: value }))}
              onBrandChange={(e) => {
                const value = e.target.value;
                setForm(prev => ({
                  ...prev,
                  brandChoice: value,
                  brandCustom: value === 'other' ? prev.brandCustom : '',
                }));
              }}
              onBrandCustomChange={(e) => setForm(prev => ({ ...prev, brandCustom: e.target.value }))}
              onLensChange={(e) => {
                const value = e.target.value;
                setForm(prev => ({
                  ...prev,
                  lensChoice: value,
                  lensCustom: value === 'other' ? prev.lensCustom : '',
                }));
              }}
              onLensCustomChange={(e) => setForm(prev => ({ ...prev, lensCustom: e.target.value }))}
            />
          </div>

          {/* Right Panel - Sticky Preview Only */}
          <div className="lg:sticky lg:top-6 lg:self-start h-fit">
            <Preview
              canvasRef={canvasRef}
              imageUrl={imageUrl}
              layout={layout}
              onDownload={handleDownload}
              fileName={fileName}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default App;
