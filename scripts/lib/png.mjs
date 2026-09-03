// Códec PNG mínimo en Node puro: decodifica, reescala y codifica sin dependencias
// externas. Cubre lo que necesita este proyecto: profundidad 8, sin entrelazado,
// color RGB, RGBA, gris y paleta.
import zlib from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i += 1) c = crcTable[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/** Decodifica un PNG a un búfer RGBA plano. */
export function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error('El archivo no es un PNG válido.');

  let offset = 8;
  let header = null;
  let palette = null;
  let transparency = null;
  const dataChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      header = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        depth: body[8],
        colorType: body[9],
        interlace: body[12]
      };
    } else if (type === 'PLTE') palette = Buffer.from(body);
    else if (type === 'tRNS') transparency = Buffer.from(body);
    else if (type === 'IDAT') dataChunks.push(Buffer.from(body));
    else if (type === 'IEND') break;
    offset += 12 + length;
  }

  if (!header) throw new Error('El PNG no declara una cabecera IHDR.');
  if (header.depth !== 8) throw new Error(`Profundidad de bits no soportada: ${header.depth}.`);
  if (header.interlace !== 0) throw new Error('Los PNG entrelazados no están soportados.');

  const channels = CHANNELS[header.colorType];
  if (!channels) throw new Error(`Tipo de color no soportado: ${header.colorType}.`);

  const { width, height } = header;
  const raw = zlib.inflateSync(Buffer.concat(dataChunks));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);

  // Reconstrucción de los filtros por línea definidos por la especificación PNG.
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const source = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const target = pixels.subarray(y * stride, y * stride + stride);
    const previous = y > 0 ? pixels.subarray((y - 1) * stride, (y - 1) * stride + stride) : null;
    for (let i = 0; i < stride; i += 1) {
      const left = i >= channels ? target[i - channels] : 0;
      const up = previous ? previous[i] : 0;
      const upLeft = previous && i >= channels ? previous[i - channels] : 0;
      let value = source[i];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += (left + up) >> 1;
      else if (filter === 4) value += paethPredictor(left, up, upLeft);
      target[i] = value & 0xff;
    }
  }

  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    const source = index * channels;
    const target = index * 4;
    if (header.colorType === 0) {
      data[target] = data[target + 1] = data[target + 2] = pixels[source];
      data[target + 3] = 255;
    } else if (header.colorType === 4) {
      data[target] = data[target + 1] = data[target + 2] = pixels[source];
      data[target + 3] = pixels[source + 1];
    } else if (header.colorType === 3) {
      const entry = pixels[source] * 3;
      data[target] = palette[entry];
      data[target + 1] = palette[entry + 1];
      data[target + 2] = palette[entry + 2];
      data[target + 3] = transparency?.[pixels[source]] ?? 255;
    } else {
      data[target] = pixels[source];
      data[target + 1] = pixels[source + 1];
      data[target + 2] = pixels[source + 2];
      data[target + 3] = header.colorType === 6 ? pixels[source + 3] : 255;
    }
  }

  return { width, height, data };
}

function lanczos(x, lobes) {
  if (x === 0) return 1;
  const a = Math.abs(x);
  if (a >= lobes) return 0;
  const pix = Math.PI * a;
  return (lobes * Math.sin(pix) * Math.sin(pix / lobes)) / (pix * pix);
}

/** Construye los pesos de remuestreo de una dimensión (Lanczos-3 adaptado a la escala). */
function weightsFor(sourceSize, targetSize) {
  const lobes = 3;
  const scale = targetSize / sourceSize;
  const support = scale < 1 ? lobes / scale : lobes;
  const rows = [];
  for (let target = 0; target < targetSize; target += 1) {
    const center = (target + 0.5) / scale - 0.5;
    const start = Math.max(0, Math.ceil(center - support));
    const end = Math.min(sourceSize - 1, Math.floor(center + support));
    const indices = [];
    const values = [];
    let total = 0;
    for (let source = start; source <= end; source += 1) {
      const weight = lanczos(scale < 1 ? (source - center) * scale : source - center, lobes);
      if (weight === 0) continue;
      indices.push(source);
      values.push(weight);
      total += weight;
    }
    for (let i = 0; i < values.length; i += 1) values[i] /= total;
    rows.push({ indices, values });
  }
  return rows;
}

/** Reescala una imagen RGBA con un filtro separable Lanczos-3. */
export function resize(image, width, height) {
  if (image.width === width && image.height === height) return image;

  const horizontal = weightsFor(image.width, width);
  const intermediate = new Float32Array(width * image.height * 4);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const { indices, values } = horizontal[x];
      let r = 0, g = 0, b = 0, a = 0;
      for (let i = 0; i < indices.length; i += 1) {
        const source = (y * image.width + indices[i]) * 4;
        const weight = values[i];
        r += image.data[source] * weight;
        g += image.data[source + 1] * weight;
        b += image.data[source + 2] * weight;
        a += image.data[source + 3] * weight;
      }
      const target = (y * width + x) * 4;
      intermediate[target] = r;
      intermediate[target + 1] = g;
      intermediate[target + 2] = b;
      intermediate[target + 3] = a;
    }
  }

  const vertical = weightsFor(image.height, height);
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const { indices, values } = vertical[y];
    for (let x = 0; x < width; x += 1) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let i = 0; i < indices.length; i += 1) {
        const source = (indices[i] * width + x) * 4;
        const weight = values[i];
        r += intermediate[source] * weight;
        g += intermediate[source + 1] * weight;
        b += intermediate[source + 2] * weight;
        a += intermediate[source + 3] * weight;
      }
      const target = (y * width + x) * 4;
      data[target] = Math.max(0, Math.min(255, Math.round(r)));
      data[target + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[target + 2] = Math.max(0, Math.min(255, Math.round(b)));
      data[target + 3] = Math.max(0, Math.min(255, Math.round(a)));
    }
  }

  return { width, height, data };
}

function chunk(type, body) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length, 0);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed), 0);
  return Buffer.concat([length, typed, crc]);
}

/** Aplica a cada línea el filtro PNG que minimiza su entropía. */
function filterScanlines(pixels, width, height, channels) {
  const stride = width * channels;
  const output = Buffer.alloc(height * (stride + 1));
  const candidate = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const line = pixels.subarray(y * stride, y * stride + stride);
    const previous = y > 0 ? pixels.subarray((y - 1) * stride, (y - 1) * stride + stride) : null;
    let bestType = 0;
    let bestScore = Infinity;
    let best = null;
    for (let type = 0; type <= 4; type += 1) {
      if (type >= 2 && !previous) continue;
      let score = 0;
      for (let i = 0; i < stride; i += 1) {
        const left = i >= channels ? line[i - channels] : 0;
        const up = previous ? previous[i] : 0;
        const upLeft = previous && i >= channels ? previous[i - channels] : 0;
        let value = line[i];
        if (type === 1) value -= left;
        else if (type === 2) value -= up;
        else if (type === 3) value -= (left + up) >> 1;
        else if (type === 4) value -= paethPredictor(left, up, upLeft);
        value &= 0xff;
        candidate[i] = value;
        score += value < 128 ? value : 256 - value;
      }
      if (score < bestScore) {
        bestScore = score;
        bestType = type;
        best = Buffer.from(candidate);
      }
    }
    output[y * (stride + 1)] = bestType;
    best.copy(output, y * (stride + 1) + 1);
  }
  return output;
}

function deflateSmallest(raw) {
  const strategies = [
    zlib.constants.Z_DEFAULT_STRATEGY,
    zlib.constants.Z_FILTERED,
    zlib.constants.Z_RLE
  ];
  let smallest = null;
  for (const strategy of strategies) {
    const compressed = zlib.deflateSync(raw, { level: 9, memLevel: 9, windowBits: 15, strategy });
    if (!smallest || compressed.length < smallest.length) smallest = compressed;
  }
  return smallest;
}

/** Codifica RGBA a PNG eligiendo paleta, RGB o RGBA según lo que resulte más liviano. */
export function encodePng(image) {
  const { width, height, data } = image;
  const pixelCount = width * height;

  let opaque = true;
  const colors = new Map();
  let paletteOverflow = false;
  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    if (data[offset + 3] !== 255) opaque = false;
    if (!paletteOverflow) {
      const key = (data[offset] * 16777216) + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
      if (!colors.has(key)) {
        if (colors.size === 256) paletteOverflow = true;
        else colors.set(key, colors.size);
      }
    }
  }

  const variants = [];

  if (!paletteOverflow) {
    const entries = [...colors.keys()];
    const palette = Buffer.alloc(entries.length * 3);
    const alpha = Buffer.alloc(entries.length);
    let needsAlpha = false;
    entries.forEach((key, index) => {
      palette[index * 3] = Math.floor(key / 16777216) & 0xff;
      palette[index * 3 + 1] = (key >>> 16) & 0xff;
      palette[index * 3 + 2] = (key >>> 8) & 0xff;
      alpha[index] = key & 0xff;
      if (alpha[index] !== 255) needsAlpha = true;
    });
    const indexed = Buffer.alloc(pixelCount);
    for (let index = 0; index < pixelCount; index += 1) {
      const offset = index * 4;
      const key = (data[offset] * 16777216) + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
      indexed[index] = colors.get(key);
    }
    const extra = [chunk('PLTE', palette)];
    if (needsAlpha) extra.push(chunk('tRNS', alpha));
    variants.push({ colorType: 3, channels: 1, pixels: indexed, extra });
  }

  if (opaque) {
    const rgb = Buffer.alloc(pixelCount * 3);
    for (let index = 0; index < pixelCount; index += 1) {
      rgb[index * 3] = data[index * 4];
      rgb[index * 3 + 1] = data[index * 4 + 1];
      rgb[index * 3 + 2] = data[index * 4 + 2];
    }
    variants.push({ colorType: 2, channels: 3, pixels: rgb, extra: [] });
  } else {
    variants.push({ colorType: 6, channels: 4, pixels: Buffer.from(data), extra: [] });
  }

  let smallest = null;
  for (const variant of variants) {
    const raw = filterScanlines(variant.pixels, width, height, variant.channels);
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8;
    header[9] = variant.colorType;
    const encoded = Buffer.concat([
      SIGNATURE,
      chunk('IHDR', header),
      ...variant.extra,
      chunk('IDAT', deflateSmallest(raw)),
      chunk('IEND', Buffer.alloc(0))
    ]);
    if (!smallest || encoded.length < smallest.length) smallest = encoded;
  }
  return smallest;
}

/**
 * Reduce la imagen a como máximo `maxColors` mediante median cut. El diseño de
 * las piezas gráficas es plano con grano fino, así que la cuantización recorta
 * mucho peso sin alterar la identidad visual.
 */
export function quantize(image, maxColors) {
  const { width, height, data } = image;
  const pixelCount = width * height;

  const counts = new Map();
  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    const key = (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  if (counts.size <= maxColors) return image;

  const unique = [...counts.entries()].map(([key, count]) => ({
    r: (key >> 16) & 0xff,
    g: (key >> 8) & 0xff,
    b: key & 0xff,
    count
  }));

  let boxes = [unique];
  while (boxes.length < maxColors) {
    // Divide siempre la caja que más error aporta: población por volumen de color.
    let targetIndex = -1;
    let targetScore = 0;
    let targetChannel = 'r';
    for (let i = 0; i < boxes.length; i += 1) {
      const box = boxes[i];
      if (box.length < 2) continue;
      let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0, population = 0;
      for (const color of box) {
        if (color.r < minR) minR = color.r;
        if (color.r > maxR) maxR = color.r;
        if (color.g < minG) minG = color.g;
        if (color.g > maxG) maxG = color.g;
        if (color.b < minB) minB = color.b;
        if (color.b > maxB) maxB = color.b;
        population += color.count;
      }
      // Ponderación perceptual aproximada de los canales.
      const spreadR = (maxR - minR) * 0.30;
      const spreadG = (maxG - minG) * 0.59;
      const spreadB = (maxB - minB) * 0.11;
      const spread = Math.max(spreadR, spreadG, spreadB);
      const score = spread * Math.log2(population + 1);
      if (score > targetScore) {
        targetScore = score;
        targetIndex = i;
        targetChannel = spread === spreadR ? 'r' : spread === spreadG ? 'g' : 'b';
      }
    }
    if (targetIndex === -1) break;

    const box = boxes[targetIndex];
    box.sort((a, b) => a[targetChannel] - b[targetChannel]);
    const total = box.reduce((sum, color) => sum + color.count, 0);
    let accumulated = 0;
    let split = 1;
    for (let i = 0; i < box.length - 1; i += 1) {
      accumulated += box[i].count;
      if (accumulated * 2 >= total) { split = i + 1; break; }
    }
    boxes.splice(targetIndex, 1, box.slice(0, split), box.slice(split));
  }

  const palette = boxes.map(box => {
    let r = 0, g = 0, b = 0, total = 0;
    for (const color of box) {
      r += color.r * color.count;
      g += color.g * color.count;
      b += color.b * color.count;
      total += color.count;
    }
    return [Math.round(r / total), Math.round(g / total), Math.round(b / total)];
  });

  const lookup = new Map();
  const nearest = (r, g, b) => {
    const key = (r << 16) | (g << 8) | b;
    const cached = lookup.get(key);
    if (cached !== undefined) return cached;
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < palette.length; i += 1) {
      const dr = (palette[i][0] - r) * 0.30;
      const dg = (palette[i][1] - g) * 0.59;
      const db = (palette[i][2] - b) * 0.11;
      const distance = dr * dr + dg * dg + db * db;
      if (distance < bestDistance) { bestDistance = distance; best = i; }
    }
    lookup.set(key, best);
    return best;
  };

  const output = new Uint8Array(data.length);
  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    const entry = palette[nearest(data[offset], data[offset + 1], data[offset + 2])];
    output[offset] = entry[0];
    output[offset + 1] = entry[1];
    output[offset + 2] = entry[2];
    output[offset + 3] = data[offset + 3];
  }
  return { width, height, data: output };
}
