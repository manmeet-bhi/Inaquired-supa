import fs from 'fs';
import path from 'path';

/**
 * Utility to process vector logos:
 * Analyzes vector path fills and applies an SVG mask for any interior
 * counter-hole patches, ensuring crisp transparent cutouts in both
 * light and dark mode (compatible with brightness(0) invert(1) filters).
 */
export function optimizeLogoSvg(inputPath: string, outputPath: string = inputPath): void {
  const svg = fs.readFileSync(inputPath, 'utf8');

  // Parse path elements
  const regex = /<path\s+d="([^"]+)"(?:\s+fill="([^"]+)")?(?:\s+transform="([^"]+)")?\s*\/>/g;
  const paths: Array<{ d: string; fill?: string; transform?: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(svg)) !== null) {
    paths.push({
      d: match[1],
      fill: match[2],
      transform: match[3] || '',
    });
  }

  // Identify hole patches vs letter body paths
  // Hole patches in raster-traced SVGs typically have light fills (off-white / gray)
  const isLightColor = (hex?: string) => {
    if (!hex || hex === 'none') return false;
    const clean = hex.replace('#', '');
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      return (r + g + b) / 3 > 180;
    }
    return false;
  };

  const holePaths = paths.filter(p => isLightColor(p.fill));
  const letterPaths = paths.filter(p => p.fill && p.fill !== 'none' && !isLightColor(p.fill));

  if (holePaths.length === 0) {
    console.log('No opaque light-colored hole patches detected. SVG is already clean.');
    return;
  }

  // Construct masked SVG with transparent cutouts
  const optimizedSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 317 93" width="317" height="93">
  <defs>
    <mask id="logo-holes">
      <!-- White base preserves visible letter geometry -->
      <rect x="0" y="0" width="317" height="93" fill="#ffffff" />
      <!-- Black cutout paths punch true transparent cutouts -->
${holePaths.map(p => `      <path d="${p.d}" fill="#000000"${p.transform ? ` transform="${p.transform}"` : ''} />`).join('\n')}
    </mask>
  </defs>

  <!-- Letter shapes with true transparent cutouts -->
  <g mask="url(#logo-holes)" fill="#000000">
${letterPaths.map(p => `    <path d="${p.d}"${p.transform ? ` transform="${p.transform}"` : ''} />`).join('\n')}
  </g>
</svg>
`;

  fs.writeFileSync(outputPath, optimizedSvg, 'utf8');
  console.log(`Successfully optimized SVG logo at: ${outputPath}`);
}

// Execute when invoked directly
const targetPath = process.argv[2] || path.resolve(process.cwd(), 'public/logo/logo.svg');
optimizeLogoSvg(targetPath);
