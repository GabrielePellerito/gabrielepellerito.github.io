import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3, Matrix3 } from 'three';
import { measureShovel, boundsInFrame } from './shovel-mechanics.mjs';
import { createRobot, poseForProgress } from '../src/robot.js';

test('three actuators, correct ancestor chain and fixed foundation', () => {
  const robot = createRobot();
  try {
    let node = robot.root.getObjectByName('ShovelAssembly');
    const chain = [];
    while (node) { chain.unshift(node.name); node = node.parent; }
    assert.deepEqual(chain, ['RobotRoot', 'BaseRotationPivot', 'RotatingStructure', 'ArmServoPivot', 'ArmAssembly', 'ShovelServoPivot', 'MountingPlate', 'ShovelAssembly']);
    for (const name of ['StepperMotor', 'ArmServomotor', 'ShovelServomotor']) assert.ok(robot.root.getObjectByName(name));
    const initial = robot.state;
    robot.joints.basePivot.rotation.y += .3; robot.root.updateMatrixWorld(true);
    assert.notDeepEqual(robot.state.tip, initial.tip);
    const baseMoved = robot.state.tip;
    robot.joints.armPivot.rotation.z += .2; robot.root.updateMatrixWorld(true);
    assert.notDeepEqual(robot.state.tip, baseMoved);
    const armMoved = robot.state.tip;
    robot.joints.shovelPivot.rotation.z += .2; robot.root.updateMatrixWorld(true);
    assert.notDeepEqual(robot.state.tip, armMoved);
    assert.deepEqual(robot.state.basePosition, initial.basePosition);
    assert.deepEqual(robot.state.rootRotation, [0, 0, 0]);
  } finally { robot.dispose(); }
});

test('continuous, reversible motion; foundation and shovel stay separated', () => {
  const robot = createRobot();
  try {
    let previous = poseForProgress(0);
    const forward = [];
    for (let i = 0; i <= 200; i++) {
      robot.setProgress(i / 200); const state = robot.state; forward.push(state);
      for (const key of ['base', 'arm', 'shovel']) assert.ok(Math.abs(state[key] - previous[key]) < .026, 'No angular jumps');
      assert.ok(Math.abs(state.base) <= Math.PI / 3 && Math.abs(state.arm) < .3 && Math.abs(state.shovel) < .3);
      const shovel = new Box3().setFromObject(robot.root.getObjectByName('ShovelAssembly'));
      const foundation = new Box3().setFromObject(robot.root.getObjectByName('StationaryBase'));
      assert.ok(!shovel.intersectsBox(foundation));
      const supports = new Box3();
      for (const child of robot.root.getObjectByName('RotatingStructure').children) {
        if (child !== robot.joints.armPivot) supports.union(new Box3().setFromObject(child));
      }
      assert.ok(shovel.min.y > supports.max.y, 'Shovel stays above the actual pedestal and shoulder motor');
      const bounds = new Box3().setFromObject(robot.root);
      assert.ok(bounds.min.y >= 0, 'The new tilt must not cross the ground plane');
      previous = state;
    }
    for (let i = 200; i >= 0; i--) { robot.setProgress(i / 200); assert.deepEqual(robot.state, forward[i]); }
    assert.deepEqual(poseForProgress(-1), poseForProgress(0));
    assert.deepEqual(poseForProgress(2), poseForProgress(1));
    assert.deepEqual(poseForProgress(NaN), poseForProgress(0));
  } finally { robot.dispose(); }
});

test('local palette option preserves mechanics; mobile geometry is lighter', () => {
  const dark = createRobot(), light = createRobot({ light: true }), mobile = createRobot({ lowPower: true });
  const describe = (r) => { const meshes = []; r.root.traverse((o) => { if (o.isMesh) meshes.push({ name: o.name, vertices: Array.from(o.geometry.attributes.position.array), transform: o.matrix.elements }); }); return meshes; };
  try {
    assert.deepEqual(describe(dark), describe(light));
    for (const p of [0, .25, .5, .75, 1]) { dark.setProgress(p); light.setProgress(p); assert.deepEqual(dark.state, light.state); }
    const count = (r) => { let n = 0; r.root.traverse((o) => { if (o.isMesh) n += (o.geometry.index?.count || o.geometry.attributes.position.count) / 3; }); return n; };
    assert.ok(count(mobile) < count(dark)); assert.ok(count(dark) < 50000);
  } finally { dark.dispose(); light.dispose(); mobile.dispose(); }
});

// Definitive reference: an upward-open tray, with its entire rear flange flush
// against the moving mounting plate. A and B are measured in world coordinates.
test('short edge is perpendicular to the original servo axis and stays flush to the plate', () => {
  for (const lowPower of [false, true]) {
    const robot = createRobot({ lowPower });
    try {
      const assembly = robot.root.getObjectByName('ShovelAssembly');
      const mount = robot.root.getObjectByName('MountingPlate');
      assert.equal(assembly.parent, mount);
      const relative = assembly.matrix.clone();
      for (let step = 0; step <= 200; step++) {
        robot.setProgress(step / 200);
        const m = measureShovel(robot);
        assert.ok(Math.abs(m.shortEdgeAxisDot) < 1e-7, 'The SHORT edge must be perpendicular to the original shaft');
        assert.ok(Math.abs(m.dot) > .999, 'The accepted tray length keeps its direction, parallel to the restored shaft');
        assert.ok(m.contactGap < 1e-7 && m.contactContained, 'Full rear contact face lies on the mounting surface');
        assert.ok(m.topEdgeGap < 1e-7, 'The short rear edge coincides with the TOP of the support');
        assert.ok(m.topEdgeParallel > 1 - 1e-10, 'The short edge is parallel to the support top edge');
        for (let i = 0; i < m.contactCorners.length; i++) assert.ok(m.contactCorners[i].distanceTo(m.platePoints[i]) < 1e-7);
        assert.deepEqual(assembly.matrix, relative, 'No separate translation or rotation of the tray');
        const localA = m.A.clone().transformDirection(mount.matrixWorld.clone().invert());
        assert.ok(localA.x < -.98, 'Longitudinal direction is toward the left free edge, not across tray width');
        assert.ok(m.openingNormal.dot(new Vector3(0, 1, 0)) > 0, 'The conservative animation never inverts the opening');
      }
      robot.setProgress(0);
      const neutral = measureShovel(robot);
      assert.ok(neutral.A.dot(new Vector3(0, 0, 1)) > .999, 'A has turned +90 degrees about WORLD Y: -X becomes +Z');
      assert.ok(neutral.B.dot(new Vector3(0, 0, 1)) > .999, 'The original motor shaft is world Z at neutral');
      assert.ok(neutral.shortEdge.dot(new Vector3(1, 0, 0)) > .999, 'The short attached edge now follows world X');
      assert.ok(neutral.openingNormal.dot(new Vector3(0, 1, 0)) > .999, 'Neutral concavity faces world up');
      assert.ok(neutral.floorHeight < neutral.rimHeight, 'Interior lies below the rim');
      const attachmentBefore = neutral.attachment.clone(), freeBefore = neutral.free.clone();
      const mountBefore = mount.matrixWorld.clone();
      robot.joints.shovelPivot.rotation.z += .12; robot.root.updateMatrixWorld(true);
      const tilted = measureShovel(robot);
      assert.notDeepEqual(mount.matrixWorld, mountBefore, 'The plate moves with the terminal servo');
      assert.ok(tilted.free.distanceTo(freeBefore) > .01 && tilted.attachment.distanceTo(attachmentBefore) > .01, 'Both the plate attachment and free edge follow the restored shaft');
      assert.ok(tilted.contactGap < 1e-7, 'Contact is preserved while the servo tilts the tray');
      const web = new Box3().setFromObject(robot.root.getObjectByName('ServoDrivePlate'));
      const face = new Box3().setFromObject(robot.root.getObjectByName('MountingPlateSurface'));
      const spacer = new Box3().setFromObject(robot.root.getObjectByName('ShovelHornStandoff'));
      const bridge = new Box3().setFromObject(robot.root.getObjectByName('TerminalPlateBridge'));
      assert.ok(web.intersectsBox(bridge) && bridge.intersectsBox(face) && web.intersectsBox(spacer), 'The retained mounting plate is connected to the original output horn');
    } finally { robot.dispose(); }
  }
});

test('open tray has raised side rims, a rounded free end and outward-facing inner surface', () => {
  for (const lowPower of [false, true]) {
    const robot = createRobot({ lowPower });
    try {
      const shell = robot.root.getObjectByName('CurvedShovel');
      const frame = robot.root.getObjectByName('MountingPlate');
      const attr = shell.geometry.attributes.position;
      const bounds = boundsInFrame(shell, frame);
      const interior = Array.from({ length: attr.count / 2 }, (_, i) => new Vector3().fromBufferAttribute(attr, i));
      const xs = [...new Set(interior.map(p => p.x))];
      const middleX = xs.reduce((a,b) => Math.abs(a-bounds.getCenter(new Vector3()).x) < Math.abs(b-bounds.getCenter(new Vector3()).x) ? a : b);
      const section = interior.filter(p => p.x === middleX).sort((a,b) => a.z-b.z);
      const floor = section.reduce((a,b) => a.y<b.y?a:b);
      assert.ok(floor.y < section[0].y && floor.y < section.at(-1).y, 'Both side edges rise above the concave interior');
      const tipSection = interior.filter(p => p.x === Math.min(...xs));
      assert.ok(Math.max(...tipSection.map(p=>p.z))-Math.min(...tipSection.map(p=>p.z)) < section.at(-1).z-section[0].z, 'Free corners are rounded in plan');
      const normals = shell.geometry.attributes.normal;
      const normalMatrix = new Matrix3().getNormalMatrix(shell.matrixWorld);
      let upward = 0;
      for(let i=0;i<attr.count/2;i++) if(new Vector3().fromBufferAttribute(normals,i).applyNormalMatrix(normalMatrix).y > 0) upward++;
      assert.ok(upward > attr.count/2 * .95, 'Interior triangles face the open top, not the underside');
    } finally { robot.dispose(); }
  }
});

test('opposite-edge mounting drives the active stroke from outside toward the arm', () => {
  const robot = createRobot();
  try {
    const arm = robot.root.getObjectByName('ArmAssembly');
    const pivotX = robot.joints.shovelPivot.position.x;
    const distance = () => {
      const m = measureShovel(robot);
      const attachment = arm.worldToLocal(m.attachment.clone());
      const tip = arm.worldToLocal(m.free.clone());
      assert.ok(attachment.x < pivotX && tip.x < pivotX, 'The tray is on the opposite, left side of the shaft');
      return { rear: pivotX - attachment.x, free: pivotX - tip.x };
    };
    // The base and parent arm are removed from this measurement so their motion
    // cannot fake an inward stroke of the terminal actuator.
    robot.setProgress(.5); const start = distance(); let previous = start;
    for (let step = 1; step <= 100; step++) {
      robot.setProgress(.5 + .28 * step / 100);
      const current = distance();
      assert.ok(current.rear <= previous.rear + 1e-9 && current.free <= previous.free + 1e-9, 'Both fixed and free edges move inward throughout the active servo stroke');
      previous = current;
    }
    assert.ok(previous.rear < start.rear && previous.free < start.free);
    robot.setProgress(1); const settled = distance();
    assert.ok(settled.rear < start.rear && settled.free < start.free, 'Final settling keeps the tray inward of its starting location');
    robot.setProgress(.5); const reversed = distance();
    assert.ok(Math.abs(reversed.rear - start.rear) < 1e-9 && Math.abs(reversed.free - start.free) < 1e-9);
  } finally { robot.dispose(); }
});

test('terminal movement remains coaxial, rigid and clear of the arm and motor', () => {
  const robot = createRobot();
  try {
    const { armPivot, shovelPivot } = robot.joints;
    const arm = robot.root.getObjectByName('ArmAssembly');
    const shell = robot.root.getObjectByName('CurvedShovel');
    const shaft = robot.root.getObjectByName('ShovelOutputShaft');
    const servo = robot.root.getObjectByName('ShovelServomotor');
    const obstacles = arm.children.filter((o) => o.name === 'ArmLamination');
    servo.traverse((o) => { if (o.isMesh) obstacles.push(o); });
    // The original motor is fixed directly to the arm again.
    const frames = [arm];
    const stationary = obstacles.map(obstacle => frames.map(frame => boundsInFrame(obstacle, frame)));
    for (let step = 0; step <= 200; step++) {
      robot.setProgress(step / 200);
      const axis = new Vector3(0, 1, 0).transformDirection(shaft.matrixWorld);
      const pivot = shovelPivot.getWorldPosition(new Vector3());
      const offset = shaft.getWorldPosition(new Vector3()).sub(pivot);
      assert.ok(offset.clone().cross(axis).length() < 1e-6, 'Terminal pivot lies on the motor output shaft');
      const shaftAxis = new Vector3(0, 1, 0).transformDirection(shaft.matrixWorld);
      assert.ok(Math.abs(shaftAxis.dot(axis)) > 1 - 1e-6, 'Shaft and joint axes are parallel');
      const tip = new Vector3(...robot.state.tip).sub(pivot);
      const armBefore = armPivot.matrixWorld.clone();
      const motorBefore = servo.matrixWorld.clone();
      const angle = shovelPivot.rotation.z;
      shovelPivot.rotation.z += .05; robot.root.updateMatrixWorld(true);
      const moved = new Vector3(...robot.state.tip).sub(pivot);
      assert.ok(tip.distanceTo(moved) > .01, 'Terminal servo actually moves the blade');
      assert.ok(Math.abs(tip.length() - moved.length()) < 1e-6, 'Rigid radius about the real joint');
      assert.ok(Math.abs(tip.dot(axis) - moved.dot(axis)) < 1e-6, 'No sideways drift along the servo shaft');
      assert.deepEqual(armPivot.matrixWorld, armBefore); assert.deepEqual(servo.matrixWorld, motorBefore);
      shovelPivot.rotation.z = angle; robot.root.updateMatrixWorld(true);
      assert.ok(new Vector3(...robot.state.tip).sub(pivot).distanceTo(tip) < 1e-6, 'Terminal motion reverses exactly');
      // Check separating planes using the actual stationary and moving geometry.
      const movingBounds = frames.map(frame => boundsInFrame(shell, frame));
      for (const obstacleBounds of stationary) {
        const separated = frames.some((_, frame) => ['x', 'y', 'z'].some(axis =>
          movingBounds[frame].min[axis] > obstacleBounds[frame].max[axis] ||
          movingBounds[frame].max[axis] < obstacleBounds[frame].min[axis]));
        assert.ok(separated, 'A separating plane keeps the tray clear of each stationary part');
      }
    }
  } finally { robot.dispose(); }
});
