// Rasterizador vectorial mínimo: convierte contornos con curvas de Bézier en
// píxeles RGBA con antialiasing, sin dependencias externas.

/** Aproxima una curva cúbica por segmentos rectos. */
function flattenCubic(points, x0, y0, x1, y1, x2, y2, x3, y3, depth = 0) {
  const dx = x3 - x0;
  const dy = y3 - y0;
  const d1 = Math.abs((x1 - x3) * dy - (y1 - y3) * dx);
  const d2 = Math.abs((x2 - x3) * dy - (y2 - y3) * dx);
  if (depth > 16 || (d1 + d2) * (d1 + d2) < 0.05 * (dx * dx + dy * dy)) {
    points.push([x3, y3]);
    return;
  }
  const x01 = (x0 + x1) / 2, y01 = (y0 + y1) / 2;
  const x12 = (x1 + x2) / 2, y12 = (y1 + y2) / 2;
  const x23 = (x2 + x3) / 2, y23 = (y2 + y3) / 2;
  const x012 = (x01 + x12) / 2, y012 = (y01 + y12) / 2;
  const x123 = (x12 + x23) / 2, y123 = (y12 + y23) / 2;
  const xm = (x012 + x123) / 2, ym = (y012 + y123) / 2;
  flattenCubic(points, x0, y0, x01, y01, x012, y012, xm, ym, depth + 1);
  flattenCubic(points, xm, ym, x123, y123, x23, y23, x3, y3, depth + 1);
}

/**
 * Convierte una lista de comandos en polígonos.
 * Comandos: ['M',x,y] ['L',x,y] ['C',x1,y1,x2,y2,x,y] ['Z']
 */
export function pathToPolygons(commands, transform = point => point) {
  const polygons = [];
  let current = null;
  let x = 0;
  let y = 0;
  for (const command of commands) {
    const [type] = command;
    if (type === 'M') {
      if (current?.length > 2) polygons.push(current);
      [, x, y] = command;
      current = [[x, y]];
    } else if (type === 'L') {
      [, x, y] = command;
      current.push([x, y]);
    } else if (type === 'C') {
      const [, x1, y1, x2, y2, x3, y3] = command;
      flattenCubic(current, x, y, x1, y1, x2, y2, x3, y3);
      x = x3;
      y = y3;
    } else if (type === 'Z') {
      if (current?.length > 2) polygons.push(current);
      current = null;
    }
  }
  if (current?.length > 2) polygons.push(current);
  return polygons.map(polygon => polygon.map(point => transform(point)));
}

/** Crea un lienzo RGBA relleno con un color sólido. */
export function createCanvas(width, height, [r, g, b, a = 255]) {
  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    data[index * 4] = r;
    data[index * 4 + 1] = g;
    data[index * 4 + 2] = b;
    data[index * 4 + 3] = a;
  }
  return { width, height, data };
}

/**
 * Rellena polígonos sobre el lienzo con regla non-zero. Usa varias submuestras
 * verticales por píxel y cobertura horizontal exacta, así los bordes curvos del
 * logotipo quedan suaves sin escalar todo el búfer.
 */
export function fillPolygons(canvas, polygons, [r, g, b], subSamples = 16) {
  const { width, height, data } = canvas;
  const edges = [];
  let minY = Infinity;
  let maxY = -Infinity;
  for (const polygon of polygons) {
    for (let i = 0; i < polygon.length; i += 1) {
      const [x0, y0] = polygon[i];
      const [x1, y1] = polygon[(i + 1) % polygon.length];
      if (y0 === y1) continue;
      edges.push({ x0, y0, x1, y1, direction: y1 > y0 ? 1 : -1 });
      minY = Math.min(minY, y0, y1);
      maxY = Math.max(maxY, y0, y1);
    }
  }
  if (!edges.length) return canvas;

  const firstRow = Math.max(0, Math.floor(minY));
  const lastRow = Math.min(height - 1, Math.ceil(maxY));
  const coverage = new Float32Array(width);
  const crossings = [];

  for (let py = firstRow; py <= lastRow; py += 1) {
    coverage.fill(0);
    for (let sample = 0; sample < subSamples; sample += 1) {
      const sy = py + (sample + 0.5) / subSamples;
      crossings.length = 0;
      for (const edge of edges) {
        const top = Math.min(edge.y0, edge.y1);
        const bottom = Math.max(edge.y0, edge.y1);
        if (sy < top || sy >= bottom) continue;
        const t = (sy - edge.y0) / (edge.y1 - edge.y0);
        crossings.push({ x: edge.x0 + t * (edge.x1 - edge.x0), direction: edge.direction });
      }
      if (crossings.length < 2) continue;
      crossings.sort((a, b) => a.x - b.x);

      let winding = 0;
      for (let i = 0; i < crossings.length - 1; i += 1) {
        winding += crossings[i].direction;
        if (winding === 0) continue;
        const spanStart = Math.max(0, crossings[i].x);
        const spanEnd = Math.min(width, crossings[i + 1].x);
        if (spanEnd <= spanStart) continue;
        const first = Math.floor(spanStart);
        const last = Math.ceil(spanEnd) - 1;
        for (let px = first; px <= last; px += 1) {
          const overlap = Math.min(spanEnd, px + 1) - Math.max(spanStart, px);
          if (overlap > 0) coverage[px] += overlap / subSamples;
        }
      }
    }

    for (let px = 0; px < width; px += 1) {
      const alpha = Math.min(1, coverage[px]);
      if (alpha <= 0) continue;
      const offset = (py * width + px) * 4;
      data[offset] = Math.round(data[offset] * (1 - alpha) + r * alpha);
      data[offset + 1] = Math.round(data[offset + 1] * (1 - alpha) + g * alpha);
      data[offset + 2] = Math.round(data[offset + 2] * (1 - alpha) + b * alpha);
    }
  }
  return canvas;
}
