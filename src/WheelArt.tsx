import { useId } from 'react';

const palette = {
  sage: ['#e4ead5', '#4d613b'], peach: ['#efe0d0', '#956748'], lavender: ['#e7e3ed', '#78628e'],
  sand: ['#ece8da', '#8b7c4f'], blue: ['#dfe8e9', '#527779'], rose: ['#eadfdb', '#92685f'],
};

export function WheelArt({ theme = 'sage', shape = 0, large = false }: { theme?: keyof typeof palette; shape?: number; large?: boolean }) {
  const id = useId().replace(/:/g, '');
  const [bg, ink] = palette[theme];
  const paths: string[] = [];
  const n = [64, 40, 46, 54, 32, 48][shape % 6];
  for (let i = 0; i < n; i++) {
    const theta = i / n * Math.PI * 2;
    const points: string[] = [];
    for (let j = 0; j <= 80; j++) {
      const phi = j / 80 * Math.PI * 2;
      const radius = shape === 1 ? 72 + 15 * Math.sin(theta * 3) : shape === 5 ? 78 + 14 * Math.cos(theta * 4) : 82;
      const tube = shape === 2 ? 26 : shape === 3 ? 35 : 30;
      let x = (radius + tube * Math.cos(phi)) * Math.cos(theta);
      let y = (radius + tube * Math.cos(phi)) * Math.sin(theta);
      const z = tube * Math.sin(phi);
      if (shape === 2) { x += 20 * Math.sin(phi); y *= .8; }
      const tilt = shape === 4 ? .38 : shape === 2 ? .85 : .72;
      const rx = x * .96 - y * .2;
      const ry = (y * .96 + x * .2) * tilt + z * .88;
      points.push(`${j === 0 ? 'M' : 'L'}${(200 + rx).toFixed(2)},${(143 + ry).toFixed(2)}`);
    }
    paths.push(points.join(' ') + 'Z');
  }
  return <svg className={`wheel-art${large ? ' wheel-art-large' : ''}`} viewBox="0 0 400 285" role="img" aria-label={`A sculptural ${theme} wheel drawn from interwoven circular lines`}>
    <defs><pattern id={`grid-${id}`} width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke={ink} strokeOpacity=".08" strokeWidth=".6"/></pattern></defs>
    <rect width="400" height="285" fill={bg}/><rect width="400" height="285" fill={`url(#grid-${id})`}/>
    <g fill="none" stroke={ink} strokeWidth={shape === 4 ? '.85' : '.65'} strokeOpacity=".85">{paths.map((d, i) => <path d={d} key={i}/>)}</g>
    <g fill="none" stroke={ink} strokeWidth=".8" opacity=".5"><path d="M20 29V19h10m340 0h10v10M20 256v10h10m340 0h10v-10"/><path d="M195 143h10m-5-5v10"/></g>
    <g fill={ink} fontFamily="monospace" fontSize="9"><text x="20" y="248">W / A</text><text x="380" y="248" textAnchor="end">FORM {String(shape + 1).padStart(2, '0')}</text></g>
  </svg>;
}
