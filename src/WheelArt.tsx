import { sealSVG, type Capsule } from '../public/archive-core.js';
export function WheelArt({ capsule }: { capsule: Capsule }) {
  return <div className="seal" dangerouslySetInnerHTML={{ __html: sealSVG(capsule) }}/>;
}
