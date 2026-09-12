export type AnnotationRect = { x: number; y: number; width: number; height: number };
export function overlaps(a: AnnotationRect, b: AnnotationRect): boolean {
  return a.x < b.x + b.width + 3 && a.x + a.width + 3 > b.x && a.y < b.y + b.height + 3 && a.y + a.height + 3 > b.y;
}
export function placeCaptions(points: readonly { x: number; y: number }[], sizes: readonly { width: number; height: number }[], bounds: { width: number; height: number }, obstacles: readonly AnnotationRect[]): AnnotationRect[] {
  const placed: AnnotationRect[] = [];
  points.forEach((point, i) => {
    const size = sizes[i];
    const candidate = (x: number, y: number) => ({ x: Math.max(4, Math.min(bounds.width - size.width - 4, x)), y: Math.max(4, Math.min(bounds.height - size.height - 4, y)), ...size });
    const choices = [candidate(point.x - size.width / 2, point.y + 48), candidate(point.x + 64, point.y), candidate(point.x - size.width - 64, point.y), candidate(point.x - size.width / 2, point.y - 115)];
    for (let y = 4; y <= bounds.height - size.height - 4; y += 12) {
      for (let x = 4; x <= bounds.width - size.width - 4; x += 12) choices.push(candidate(x, y));
    }
    const distance = (r: AnnotationRect) => Math.hypot(r.x + r.width / 2 - point.x, r.y + r.height / 2 - (point.y + 50));
    const free = choices.filter(r => ![...obstacles, ...placed].some(o => overlaps(r, o))).sort((a, b) => distance(a) - distance(b));
    placed.push(free[0] ?? choices.filter(r => !placed.some(o => overlaps(r, o))).sort((a, b) => distance(a) - distance(b))[0] ?? choices[0]);
  });
  return placed;
}
