const TAGS = {
  0x010f: 'Make',
  0x0110: 'Model',
  0x8769: 'ExifIFDPointer',
  0x829a: 'ExposureTime',
  0x829d: 'FNumber',
  0x8827: 'ISOSpeedRatings',
  0x8830: 'PhotographicSensitivity',
  0x920a: 'FocalLength',
  0xa433: 'LensMake',
  0xa434: 'LensModel',
};

const TYPE_SIZES = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  7: 1,
};

const textDecoder = new TextDecoder('ascii');

function getString(view, start, length) {
  const slice = new Uint8Array(view.buffer, start, length);
  return textDecoder.decode(slice);
}

function readAscii(view, start, length) {
  const text = getString(view, start, length);
  const nullIndex = text.indexOf('\0');
  return (nullIndex >= 0 ? text.slice(0, nullIndex) : text).trim();
}

function readRational(view, start, little) {
  const numerator = view.getUint32(start, little);
  const denominator = view.getUint32(start + 4, little);
  return { numerator, denominator };
}

function readValue(view, type, count, start, little) {
  switch (type) {
    case 1:
    case 7: {
      if (count === 1) {
        return view.getUint8(start);
      }
      return Array.from(new Uint8Array(view.buffer, start, count));
    }
    case 2:
      return readAscii(view, start, count);
    case 3: {
      if (count === 1) {
        return view.getUint16(start, little);
      }
      const values = [];
      for (let i = 0; i < count; i += 1) {
        values.push(view.getUint16(start + i * 2, little));
      }
      return values;
    }
    case 4: {
      if (count === 1) {
        return view.getUint32(start, little);
      }
      const values = [];
      for (let i = 0; i < count; i += 1) {
        values.push(view.getUint32(start + i * 4, little));
      }
      return values;
    }
    case 5: {
      if (count === 1) {
        return readRational(view, start, little);
      }
      const values = [];
      for (let i = 0; i < count; i += 1) {
        values.push(readRational(view, start + i * 8, little));
      }
      return values;
    }
    default:
      return null;
  }
}

function readIFD(view, tiffOffset, ifdOffset, little) {
  const entries = view.getUint16(ifdOffset, little);
  const tags = {};
  let exifOffset = null;

  for (let i = 0; i < entries; i += 1) {
    const entryOffset = ifdOffset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, little);
    const type = view.getUint16(entryOffset + 2, little);
    const count = view.getUint32(entryOffset + 4, little);
    const valueSize = (TYPE_SIZES[type] || 0) * count;
    let valueOffset = entryOffset + 8;

    if (valueSize > 4) {
      valueOffset = tiffOffset + view.getUint32(valueOffset, little);
    }

    const value = readValue(view, type, count, valueOffset, little);
    if (TAGS[tag]) {
      tags[TAGS[tag]] = value;
    }

    if (tag === 0x8769) {
      exifOffset = value;
    }
  }

  return { tags, exifOffset };
}

export function parseExif(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
    return {};
  }

  let offset = 2;
  while (offset < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      break;
    }

    const marker = view.getUint16(offset, false);
    const size = view.getUint16(offset + 2, false);
    const segmentStart = offset + 4;

    if (marker === 0xffe1) {
      const header = getString(view, segmentStart, 4);
      if (header === 'Exif') {
        const tiffOffset = segmentStart + 6;
        const endian = view.getUint16(tiffOffset, false);
        const little = endian === 0x4949;
        const firstIFDOffset = view.getUint32(tiffOffset + 4, little);
        const ifd0 = readIFD(view, tiffOffset, tiffOffset + firstIFDOffset, little);
        let tags = { ...ifd0.tags };

        if (ifd0.exifOffset) {
          const exif = readIFD(view, tiffOffset, tiffOffset + ifd0.exifOffset, little);
          tags = { ...tags, ...exif.tags };
        }

        return tags;
      }
    }

    offset += 2 + size;
  }

  return {};
}

export function toNumber(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (Array.isArray(value)) {
    return toNumber(value[0]);
  }
  if (typeof value === 'object' && value.numerator != null) {
    if (!value.denominator) {
      return null;
    }
    return value.numerator / value.denominator;
  }
  return null;
}

export function normalizeString(value) {
  if (value == null) {
    return '';
  }
  if (Array.isArray(value)) {
    return normalizeString(value[0]);
  }
  return String(value).trim();
}

