// This module is bundled ONLY into the Playwright-intercepted response.
import { ArrowHelper, Box3, BufferGeometry, DoubleSide, Float32BufferAttribute, Group, LineBasicMaterial, LineLoop, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, SphereGeometry, Vector3 } from 'three';
import { measureShovel } from './shovel-mechanics.mjs';

export function renderShovelReview({ robot, scene, renderer }, { view = 'closeup', debug = true } = {}) {
  const m = measureShovel(robot);
  const bounds = new Box3().setFromObject(robot.root.getObjectByName('MountingPlate'));
  bounds.union(new Box3().setFromObject(robot.root.getObjectByName('ShovelServomotor')));
  const target = bounds.getCenter(new Vector3());
  const aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
  const directions = { right: [1, 0, 0], rear: [0, 0, -1], top: [0, 1, 0], left: [-1, 0, 0] };
  let camera;
  if (directions[view]) {
    const height = 2.65;
    camera = new OrthographicCamera(-height * aspect / 2, height * aspect / 2, height / 2, -height / 2, .1, 40);
    camera.position.copy(target).addScaledVector(new Vector3(...directions[view]), 8);
    if (view === 'top') camera.up.set(0, 0, -1);
  } else {
    camera = new PerspectiveCamera(35, aspect, .1, 40);
    camera.position.copy(target).add(new Vector3(-2.2, 1.9, 3.2));
  }
  camera.lookAt(target); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  const helpers = new Group();
  if (debug) {
    helpers.add(new ArrowHelper(m.A, m.attachment, 1.0, 0x40d9ff, .11, .05));
    helpers.add(new ArrowHelper(m.B, m.pivot, .85, 0xffc34a, .11, .05));
    helpers.add(new ArrowHelper(m.shortEdge, m.attachment, .65, 0xbb95ff, .09, .045));
    const pivot = new Mesh(new SphereGeometry(.034, 16, 10), new MeshBasicMaterial({ color: 0xf56cf0 }));
    pivot.position.copy(m.pivot); helpers.add(pivot);
    // The actual contact face is highlighted even through the opaque flange.
    const plane = new BufferGeometry();
    plane.setAttribute('position', new Float32BufferAttribute(m.platePoints.flatMap(p => p.toArray()), 3));
    plane.setIndex([0, 2, 1, 2, 3, 1]);
    helpers.add(new Mesh(plane, new MeshBasicMaterial({ color: 0x6ff099, transparent: true, opacity: .6, side: DoubleSide })));
    helpers.add(new LineLoop(new BufferGeometry().setFromPoints([0, 1, 3, 2].map(i => m.platePoints[i])), new LineBasicMaterial({ color: 0x6ff099 })));
    helpers.traverse((o) => { o.renderOrder = 100; if (o.material) { o.material.depthTest = false; o.material.depthWrite = false; o.material.toneMapped = false; } });
    scene.add(helpers);
  }
  renderer.render(scene, camera);
  const report = {
    projection: camera.isOrthographicCamera ? 'orthographic' : 'perspective',
    cameraDirection: camera.getWorldDirection(new Vector3()).toArray(),
    A: m.A.toArray(), B: m.B.toArray(), dotAB: m.dot, shortEdgeAxisDot: m.shortEdgeAxisDot, contactGap: m.contactGap,
    topEdgeGap: m.topEdgeGap, topEdgeParallel: m.topEdgeParallel,
    contactContained: m.contactContained, openingNormal: m.openingNormal.toArray(),
    progress: robot.state.progress, debug
  };
  const geometries = new Set(), materials = new Set();
  helpers.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); });
  helpers.removeFromParent();
  for (const g of geometries) g.dispose();
  for (const material of materials) material.dispose();
  return report;
}
