import { Vector3 } from 'three';
import { timeline } from './timeline.js';

// Contact is measured on the actual cutting nose, including the curved rim and
// underside. The straight front reinforcement alone misses the lower corners
// when the approved tray is rolled by its original servo axis.
// A raised bank is positioned at this reachable height, rather than lengthening
// the arm or moving its foundation. Only the front of the tray enters the bank.
export function cuttingPoint(robot) {
  const point = new Vector3(0, Infinity, 0), vertex = new Vector3();
  for (const name of ['CurvedShovel', 'FreeFrontEdge']) {
    const mesh = robot.root.getObjectByName(name), positions = mesh.geometry.attributes.position;
    mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox, nose = bounds.min.x + (bounds.max.x - bounds.min.x) * .3;
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      if (name === 'CurvedShovel' && vertex.x > nose) continue;
      mesh.localToWorld(vertex);
      if (vertex.y < point.y) point.copy(vertex);
    }
  }
  return point;
}
export function excavationSite(robot) {
  robot.setPose(timeline(.35));
  const contact = cuttingPoint(robot);
  robot.setPose(timeline(0));
  return { center: contact.clone(), height: contact.y, radius: 1.55, depth: 1.48, depthScale: .55 };
}
