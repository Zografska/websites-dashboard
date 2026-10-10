const LABEL_ONLY_BULLET = /^\s*[-*]\s+\*\*[^*]+:\*\*\s*$/

/** Strips HTML comments (TODO placeholders) and bullets left as just a bold label (D8). */
export function cleanMethodology(md: string): string {
  return md
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .filter((line) => !LABEL_ONLY_BULLET.test(line))
    .join('\n')
}
