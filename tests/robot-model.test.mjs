import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3, Matrix3 } from 'three';
import { createRobot, poseForProgress } from '../src/robot.js';

test('three actuators, correct ancestor chain and fixed foundation', () => {
  const robot = createRobot();
  try {
    let node = robot.root.getObjectByName('ShovelAssembly');
    const chain = [];
    while (node) { chain.unshift(node.name); node = node.parent; }
    assert.deepEqual(chain, ['RobotRoot', 'BaseRotationPivot', 'RotatingStructure', 'ArmServoPivot', 'ArmAssembly', 'ShovelServoPivot', 'ShovelAssembly']);
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
      assert.ok(bounds.min.y >= 0 && bounds.max.y < 4.1);
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

// Photo-derived relationships, in the terminal joint's frame: long axis -X,
// convex face +Z (away from the arm), opening -Z, reinforced lower rim below
// the mounting rim. Do not assert just a chosen Euler angle or a local normal.
test('photographic shovel profile and mounting survive every pose and mobile simplification', () => {
  for (const lowPower of [false, true]) {
    const robot = createRobot({ lowPower });
    try {
      const assembly = robot.root.getObjectByName('ShovelAssembly');
      const blade = robot.root.getObjectByName('ShovelBlade');
      const shell = robot.root.getObjectByName('CurvedShovel');
      const attr = shell.geometry.attributes.position;
      const outerCount = attr.count / 2;
      // Select a section halfway along the shell, away from end seam normals.
      shell.geometry.computeBoundingBox();
      const midpoint = shell.geometry.boundingBox.getCenter(new Vector3()).x;
      let sectionX = attr.getX(0);
      for (let i = 0; i < outerCount; i++) if (Math.abs(attr.getX(i) - midpoint) < Math.abs(sectionX - midpoint)) sectionX = attr.getX(i);
      for (const progress of [0, .25, .5, .75, 1]) {
        robot.setProgress(progress);
        const section = [];
        for (let i = 0; i < outerCount; i++) if (attr.getX(i) === sectionX) {
          section.push({ i, point: assembly.worldToLocal(shell.localToWorld(new Vector3().fromBufferAttribute(attr, i))) });
        }
        section.sort((a, b) => b.point.y - a.point.y);
        const upper = section[0].point, lower = section.at(-1).point;
        const crest = section.reduce((a, b) => a.point.z > b.point.z ? a : b);
        const chord = upper.clone().add(lower).multiplyScalar(.5);
        assert.ok(upper.y < 0 && lower.y < upper.y, 'The entire cross section hangs below its servo');
        assert.ok(Math.abs(upper.z - lower.z) < 1e-6, 'Opening rims share a rear plane');
        assert.ok(crest.point.z > chord.z, 'Convex back points away from the arm, opening toward it');
        assert.ok(crest.point.y < upper.y && crest.point.y > lower.y, 'Convex crest is between the upper and lower edges');
        assert.ok(section.every(({ point }) => point.x < 0), 'Shovel projects to the photographed side of the mount');
        const normal = new Vector3().fromBufferAttribute(shell.geometry.attributes.normal, crest.i)
          .applyNormalMatrix(new Matrix3().getNormalMatrix(shell.matrixWorld));
        const servoFront = new Vector3(0, 0, 1).transformDirection(robot.joints.armPivot.matrixWorld);
        assert.ok(normal.dot(servoFront) > .99, 'Outward face normal follows the servo front, including parent rotations');
        const lowerRail = assembly.worldToLocal(robot.root.getObjectByName('ShovelLowerRail').getWorldPosition(new Vector3()));
        const upperRail = assembly.worldToLocal(robot.root.getObjectByName('ShovelRearRail').getWorldPosition(new Vector3()));
        assert.ok(lowerRail.y < upperRail.y && upperRail.y < 0, 'The reinforced edge is below the attachment');
        assert.ok(blade.matrix.determinant() > 0, 'The blade must never be mirrored');
      }
      robot.setProgress(0);
      const attachment = new Box3().setFromObject(robot.root.getObjectByName('ShovelEndSupport'));
      const bracket = new Box3().setFromObject(robot.root.getObjectByName('ShovelSideBracket'));
      assert.ok(attachment.intersectsBox(bracket), 'Blade end support must meet the mounting plate');
      const horn = new Box3().setFromObject(robot.root.getObjectByName('ShovelServoHorn'));
      const standoff = new Box3().setFromObject(robot.root.getObjectByName('ShovelHornStandoff'));
      assert.ok(standoff.intersectsBox(horn) && standoff.intersectsBox(bracket), 'No floating gap between servo horn and bracket');
    } finally { robot.dispose(); }
  }
});

test('terminal movement remains coaxial, rigid and clear of the arm and motor', () => {
  const robot = createRobot();
  try {
    const { armPivot, shovelPivot } = robot.joints;
    const arm = robot.root.getObjectByName('ArmAssembly');
    const shell = robot.root.getObjectByName('CurvedShovel');
    const shaft = robot.root.getObjectByName('ShovelOutputShaft');
    const servo = robot.root.getObjectByName('ShovelServomotor');
    const attr = shell.geometry.attributes.position;
    for (let step = 0; step <= 200; step++) {
      robot.setProgress(step / 200);
      const axis = new Vector3(0, 0, 1).transformDirection(arm.matrixWorld);
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
      // Conservative separating-plane check against actual plank and motor vertices.
      const obstacles = arm.children.filter((o) => o.name === 'ArmLamination');
      servo.traverse((o) => { if (o.isMesh) obstacles.push(o); });
      let front = -Infinity;
      for (const obstacle of obstacles) {
        const vertices = obstacle.geometry.attributes.position;
        for (let i = 0; i < vertices.count; i++) front = Math.max(front, arm.worldToLocal(obstacle.localToWorld(new Vector3().fromBufferAttribute(vertices, i))).z);
      }
      for (let i = 0; i < attr.count; i++) {
        const point = arm.worldToLocal(shell.localToWorld(new Vector3().fromBufferAttribute(attr, i)));
        assert.ok(point.z > front, 'Shell never penetrates the parent plank or servo housing');
      }
    }
  } finally { robot.dispose(); }
});
