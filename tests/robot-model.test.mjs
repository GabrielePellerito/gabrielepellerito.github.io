import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
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
      assert.ok(shovel.min.y > 2.5, 'Shovel remains clear of pedestal and ground');
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

test('identical mechanics in both palettes; mobile geometry is lighter', () => {
  const dark = createRobot(), light = createRobot({ light: true }), mobile = createRobot({ lowPower: true });
  const describe = (r) => { const meshes = []; r.root.traverse((o) => { if (o.isMesh) meshes.push({ name: o.name, vertices: Array.from(o.geometry.attributes.position.array), transform: o.matrix.elements }); }); return meshes; };
  try {
    assert.deepEqual(describe(dark), describe(light));
    for (const p of [0, .25, .5, .75, 1]) { dark.setProgress(p); light.setProgress(p); assert.deepEqual(dark.state, light.state); }
    const count = (r) => { let n = 0; r.root.traverse((o) => { if (o.isMesh) n += (o.geometry.index?.count || o.geometry.attributes.position.count) / 3; }); return n; };
    assert.ok(count(mobile) < count(dark)); assert.ok(count(dark) < 50000);
    // The visible surface must face upward, not disappear through backface culling.
    const normals = dark.root.getObjectByName('CurvedShovel').geometry.attributes.normal;
    assert.ok(normals.getY(7) > .5);
  } finally { dark.dispose(); light.dispose(); mobile.dispose(); }
});
