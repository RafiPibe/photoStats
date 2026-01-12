import './App.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeString, parseExif, toNumber } from './utils/exif';

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
  { pattern: /sigma/i, label: 'Sigma' },
  { pattern: /zeiss/i, label: 'Zeiss' },
  { pattern: /olympus|om system|omds/i, label: 'Olympus' },
  { pattern: /pentax/i, label: 'Pentax' },
  { pattern: /ricoh|gr/i, label: 'Ricoh' },
  { pattern: /hasselblad/i, label: 'Hasselblad' },
  { pattern: /dji/i, label: 'DJI' },
  { pattern: /gopro/i, label: 'GoPro' },
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
  Zeiss: 1.35,
};
const BRAND_LOGOS = {
  Apple: '/logos/Apple.svg',
  Fujifilm: '/logos/Fujifilm.svg',
  Leica: '/logos/Leica.svg',
  Sigma: '/logos/Sigma.svg',
  Sony: '/logos/Sony.svg',
  Zeiss: '/logos/Zeiss.svg',
};
const LENS_OPTIONS = Object.keys(BRAND_LOGOS);

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
  const panelPadding = panelSize * 0.12;
  const footerPadding = panelSize * 0.18;
  const scale = panelSize / 238;
  const infoGap = 27 * scale;
  const infoSpacing = 123 * scale;
  const numberSize = 36 * scale;
  const labelSize = 13 * scale;
  const labelGap = 8 * scale;
  const infoToFooterGap = 103 * scale;
  const cameraSize = 16 * scale;
  const brandSize = 18 * scale;
  const brandGap = 12 * scale;

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
  const statsTop = panelTop + infoGap;
  const numberBaseline = statsTop + numberSize;
  const labelBaseline = numberBaseline + labelGap + labelSize;

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

  const footerY = labelBaseline + infoToFooterGap;
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
  const panelPadding = panelSize * 0.12;
  const footerPadding = panelSize * 0.18;
  const scale = panelSize / 238;
  const infoTop = 125 * scale;
  const infoSpacing = 123 * scale;
  const infoToFooterGap = 211 * scale;
  const nameToBrandGap = 32 * scale;
  const numberSize = 36 * scale;
  const labelSize = 13 * scale;
  const labelGap = 8 * scale;
  const cameraSize = 16 * scale;
  const brandSize = 18 * scale;
  const lensLineGap = 14 * scale;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(panelLeft, 0, panelSize, height);
  ctx.fillStyle = TEXT_COLOR;

  const stats = displayData.stats;
  const labelBaselineOffset = labelGap + labelSize;

  stats.forEach((stat, index) => {
    const numberBaseline = infoTop + numberSize + index * infoSpacing;
    const labelBaseline = numberBaseline + labelBaselineOffset;
    const textX = panelLeft + panelPadding;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `500 ${numberSize}px ${FONT_FAMILY}`;
    ctx.fillText(stat.value, textX, numberBaseline);
    ctx.font = `300 ${labelSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = '#4b463e';
    ctx.fillText(stat.label, textX, labelBaseline);
    ctx.fillStyle = TEXT_COLOR;
  });

  const lastLabelBaseline =
    infoTop +
    numberSize +
    (stats.length - 1) * infoSpacing +
    labelBaselineOffset;
  const cameraBaseline = lastLabelBaseline + infoToFooterGap;
  const brandBaseline = cameraBaseline + nameToBrandGap + brandSize;
  ctx.textAlign = 'left';
  drawFittedText(
    ctx,
    displayData.cameraName,
    panelLeft + footerPadding,
    cameraBaseline,
    panelSize - footerPadding * 2,
    cameraSize,
    200
  );
  drawBrandLensStack({
    ctx,
    x: panelLeft + footerPadding,
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
    return {
      cameraName,
      brandText: brandDisplay,
      brandKey,
      lensText: lens,
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

    setStatus('Loading image and metadata...');
    setFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);

    try {
      const [buffer, image] = await Promise.all([
        file.arrayBuffer(),
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Image failed to load'));
          img.src = objectUrl;
        }),
      ]);

      imageRef.current = image;
      const orientation = image.width >= image.height ? 'landscape' : 'portrait';
      setImageInfo({ width: image.width, height: image.height });

      const exif = parseExif(buffer);
      const derived = buildFormFromExif(exif, orientation);
      setAutoForm(derived);
      setForm(derived);
      setStatus(
        Object.keys(exif).length
          ? 'Metadata pulled from EXIF. Update the fields if needed.'
          : 'No EXIF metadata found. Fill the fields manually.'
      );
    } catch (error) {
      setStatus('Could not load the image. Please try another file.');
    }
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleBrandChoice = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      brandChoice: value,
      brandCustom: value === 'other' ? prev.brandCustom : '',
    }));
  };

  const handleBrandCustom = (event) => {
    setForm((prev) => ({ ...prev, brandCustom: event.target.value }));
  };

  const handleLensChoice = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      lensChoice: value,
      lensCustom: value === 'other' ? prev.lensCustom : '',
    }));
  };

  const handleLensCustom = (event) => {
    setForm((prev) => ({ ...prev, lensCustom: event.target.value }));
  };

  const handleReset = () => {
    setForm(autoForm);
  };

  const handleDownload = () => {
    if (!canvasRef.current) {
      return;
    }
    const link = document.createElement('a');
    const safeName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'photo';
    link.download = `${safeName}-photostats.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">PhotoStats Studio</p>
          <h1>Turn EXIF metadata into a clean, shareable frame.</h1>
          <p className="hero__lead">
            Upload a photo, auto-fill the stats, and export a polished PNG with
            camera branding and lens info.
          </p>
        </div>
        <div className="hero__actions">
          <button
            className="button button--primary"
            onClick={handleDownload}
            disabled={!imageUrl}
            type="button"
          >
            Download PNG
          </button>
          <button
            className="button button--ghost"
            onClick={handleReset}
            disabled={!imageUrl}
            type="button"
          >
            Reset to EXIF
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="upload-card">
            <label className="file-drop" htmlFor="photo-upload">
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              <span className="file-drop__title">
                {imageUrl ? 'Swap photo' : 'Drop a photo here'}
              </span>
              <span className="file-drop__subtitle">
                JPG works best for full EXIF metadata.
              </span>
            </label>
            {imageUrl ? (
              <div className="thumb">
                <img src={imageUrl} alt="Uploaded preview" />
              </div>
            ) : (
              <div className="thumb thumb--empty">No image loaded</div>
            )}
            <div className="status-pill">{status}</div>
          </div>

          <form className="meta-form">
            <div className="field field--red">
              <label htmlFor="cameraName">Camera name</label>
              <input
                id="cameraName"
                type="text"
                placeholder="Sony ILCE-7RM2"
                value={form.cameraName}
                onChange={handleChange('cameraName')}
              />
            </div>
            <div className="field field--orange">
              <label htmlFor="brand">Brand</label>
              <select
                id="brand"
                value={form.brandChoice}
                onChange={handleBrandChoice}
              >
                <option value="none">None</option>
                {BRAND_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
              {form.brandChoice === 'other' && (
                <input
                  type="text"
                  placeholder="Custom brand"
                  value={form.brandCustom}
                  onChange={handleBrandCustom}
                />
              )}
            </div>
            <div className="field field--green">
              <label htmlFor="lens">Lens used</label>
              <select id="lens" value={form.lensChoice} onChange={handleLensChoice}>
                <option value="">None</option>
                {LENS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
              {form.lensChoice === 'other' && (
                <input
                  type="text"
                  placeholder="Custom lens"
                  value={form.lensCustom}
                  onChange={handleLensCustom}
                />
              )}
            </div>
            <div className="field field--darkgreen">
              <label htmlFor="aperture">f</label>
              <input
                id="aperture"
                type="text"
                placeholder="4"
                value={form.aperture}
                onChange={handleChange('aperture')}
              />
            </div>
            <div className="field field--blue">
              <label htmlFor="shutterSpeed">Shutter speed</label>
              <input
                id="shutterSpeed"
                type="text"
                placeholder="1/125"
                value={form.shutterSpeed}
                onChange={handleChange('shutterSpeed')}
              />
            </div>
            <div className="field field--purple">
              <label htmlFor="focalLength">mm</label>
              <input
                id="focalLength"
                type="text"
                placeholder="46.1"
                value={form.focalLength}
                onChange={handleChange('focalLength')}
              />
            </div>
            <div className="field field--pink">
              <label htmlFor="iso">ISO</label>
              <input
                id="iso"
                type="text"
                placeholder="1000"
                value={form.iso}
                onChange={handleChange('iso')}
              />
            </div>
            <div className="field field--neutral">
              <label htmlFor="orientation">Orientation</label>
              <select
                id="orientation"
                value={form.orientation}
                onChange={handleChange('orientation')}
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </form>
          <p className="form-note">
            Logo assets live in <span>public/logos</span> and auto-appear when the
            brand matches.
          </p>
        </section>

        <section className="panel">
          <div className="preview-card">
            <div className="preview-header">
              <div>
                <p className="preview-title">Output preview</p>
                <p className="preview-subtitle">
                  {layout
                    ? `${layout.canvasWidth} x ${layout.canvasHeight}px`
                    : 'Waiting for image'}
                </p>
              </div>
              <div className="preview-badge">Plus Jakarta Sans</div>
            </div>
            <div className="canvas-shell">
              {imageUrl ? (
                <canvas ref={canvasRef} />
              ) : (
                <div className="canvas-placeholder">
                  Upload a photo to see the final frame.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
