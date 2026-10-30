// Geometric inspection shared by Node tests and the intercepted Playwright bundle.
// Never imported by the production scene. Coordinates come from actual meshes.
import { Box3, Matrix3, Vector3 } from 'three';

export function boundsInFrame(mesh, frame) {
  const bounds = new Box3();
  const positions = mesh.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    bounds.expandByPoint(frame.worldToLocal(mesh.localToWorld(new Vector3().fromBufferAttribute(positions, i))));
  }
  return bounds;
}

export function measureShovel(robot) {
  robot.root.updateMatrixWorld(true);
  const find = (name) => robot.root.getObjectByName(name);
  const frame = find('MountingPlate');
  const plate = boundsInFrame(find('MountingPlateSurface'), frame);
  const rear = boundsInFrame(find('RearAttachmentEdge'), frame);
  const front = boundsInFrame(find('FreeFrontEdge'), frame);
  // Compare the upper midpoints of the attached and free edges, at rim height.
  const attachmentCenter = rear.getCenter(new Vector3()); attachmentCenter.x = rear.max.x; attachmentCenter.y = rear.max.y;
  const freeCenter = front.getCenter(new Vector3()); freeCenter.y = front.max.y;
  const contactCorners = [rear.min.y, rear.max.y].flatMap((y) => [rear.min.z, rear.max.z].map((z) => new Vector3(rear.max.x, y, z)));
  const platePoints = contactCorners.map((p) => new Vector3(plate.min.x, p.y, p.z));
  const world = (point) => frame.localToWorld(point.clone());
  const attachment = world(attachmentCenter), free = world(freeCenter);
  const A = free.clone().sub(attachment).normalize();
  // CylinderGeometry's Y axis, transformed by the REAL shaft mesh's matrix.
  const B = new Vector3(0, 1, 0).transformDirection(find('ShovelOutputShaft').matrixWorld);
  const shell = find('CurvedShovel');
  const rearMesh = find('RearAttachmentEdge'), plateMesh = find('MountingPlateSurface');
  rearMesh.geometry.computeBoundingBox(); plateMesh.geometry.computeBoundingBox();
  const rearLocal = rearMesh.geometry.boundingBox, plateLocal = plateMesh.geometry.boundingBox;
  const rearTopEnds = [rearLocal.min.z, rearLocal.max.z].map(z => rearMesh.localToWorld(new Vector3(rearLocal.max.x, rearLocal.max.y, z)));
  const plateTopEnds = [plateLocal.min.z, plateLocal.max.z].map(z => plateMesh.localToWorld(new Vector3(plateLocal.min.x, plateLocal.max.y, z)));
  const shortEdge = rearTopEnds[1].clone().sub(rearTopEnds[0]).normalize();
  const supportTopEdge = plateTopEnds[1].clone().sub(plateTopEnds[0]).normalize();
  const positions = shell.geometry.attributes.position, normals = shell.geometry.attributes.normal;
  let bottom = Infinity, floorIndex = 0;
  for (let i = 0; i < positions.count / 2; i++) {
    const point = frame.worldToLocal(shell.localToWorld(new Vector3().fromBufferAttribute(positions, i)));
    if (point.y < bottom) { bottom = point.y; floorIndex = i; }
  }
  const openingNormal = new Vector3().fromBufferAttribute(normals, floorIndex)
    .applyNormalMatrix(new Matrix3().getNormalMatrix(shell.matrixWorld));
  return {
    A, B, pivot: robot.joints.shovelPivot.getWorldPosition(new Vector3()), attachment, free,
    contactCorners: contactCorners.map(world), platePoints: platePoints.map(world),
    shortEdge, supportTopEdge, shortEdgeAxisDot: shortEdge.dot(B),
    topEdgeGap: Math.max(...rearTopEnds.map((p, i) => p.distanceTo(plateTopEnds[i]))),
    topEdgeParallel: Math.abs(shortEdge.dot(supportTopEdge)),
    dot: A.dot(B), contactGap: Math.abs(rear.max.x - plate.min.x),
    contactContained: rear.min.y >= plate.min.y - 1e-7 && rear.max.y <= plate.max.y + 1e-7 && rear.min.z >= plate.min.z - 1e-7 && rear.max.z <= plate.max.z + 1e-7,
    openingNormal, floorHeight: bottom, rimHeight: front.max.y,
    rear, plate, front
  };
}
