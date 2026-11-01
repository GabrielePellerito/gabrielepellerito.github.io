import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRobot } from '../src/robot.js';
import { timeline } from '../src/timeline.js';
import { cuttingPoint, excavationSite } from '../src/digging.js';
import { createTerrain } from '../src/terrain.js';
import { measureShovel } from './shovel-mechanics.mjs';
import { PerspectiveCamera } from 'three';
import { frameCinematicCamera } from '../src/cinematic-camera.js';

test('narrative uses only the approved joints, continuous and exactly reversible', () => {
  const robot = createRobot();
  try {
    let previous = timeline(0);
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000, state = timeline(p); robot.setPose(state);
      for (const axis of ['base', 'arm', 'shovel']) assert.ok(Math.abs(state[axis] - previous[axis]) < .02);
      assert.deepEqual(robot.state.rootRotation, [0, 0, 0]);
      assert.deepEqual(robot.state.basePosition, [0, 0, 0]); previous = state;
      if (i % 100 === 0) {
        const m = measureShovel(robot); assert.ok(m.contactGap < 1e-7 && Math.abs(m.shortEdgeAxisDot) < 1e-7);
        const snapshot = robot.state; robot.setPose(timeline(1)); robot.setPose(timeline(p)); assert.deepEqual(robot.state, snapshot);
      }
    }
  } finally { robot.dispose(); }
});
test('measured cutting edge contacts the bank, excavates inside the growing cavity, then clears it', () => {
  const robot = createRobot();
  try {
    const site = excavationSite(robot);
    robot.setPose(timeline(.35)); assert.ok(cuttingPoint(robot).distanceTo(site.center) < 1e-9);
    for (let i = 0; i <= 100; i++) {
      const p = .15 + .2 * i / 100; robot.setPose(timeline(p)); assert.ok(cuttingPoint(robot).y >= site.height - 1e-8);
    }
    let deepest = 0;
    for (let i = 0; i <= 100; i++) {
      const state = timeline(.35 + .16 * i / 100); robot.setPose(state); const tip = cuttingPoint(robot);
      const depth = site.height - tip.y; deepest = Math.max(deepest, depth);
      assert.ok(depth >= -1e-8 && depth < site.depth);
      assert.ok(Math.hypot(tip.x - site.center.x, tip.z - site.center.z) <= .002 + state.opening * .96 * .86);
    }
    assert.ok(deepest > .2); robot.setPose(timeline(.61)); assert.ok(cuttingPoint(robot).y > site.height + .5);
  } finally { robot.dispose(); }
});
test('cavity is real depth geometry; camera crosses its opening; all states reset', () => {
  const robot = createRobot(), site = excavationSite(robot), terrain = createTerrain(site), camera = new PerspectiveCamera(32, 1.5, .1, 60);
  try {
    terrain.update(timeline(0)); const geometry = terrain.root.getObjectByName('FracturedSurface').geometry;
    const initial = [...geometry.attributes.position.array];
    terrain.update(timeline(.7)); assert.ok(terrain.radius > .8);
    const wall = terrain.root.getObjectByName('CavityWalls').geometry; wall.computeBoundingBox(); assert.ok(wall.boundingBox.min.y <= -site.depth);
    frameCinematicCamera(camera, timeline(.85), site); assert.ok(camera.position.y > site.height);
    frameCinematicCamera(camera, timeline(1), site); assert.ok(camera.position.y < site.height);
    assert.ok(Math.hypot(camera.position.x - site.center.x, camera.position.z - site.center.z) < terrain.radius);
    terrain.update(timeline(0)); assert.deepEqual([...geometry.attributes.position.array], initial);
    for (const p of [0, .15, .35, .5, .7, .85, 1]) { assert.equal(timeline(p).light > 0, p > .72); assert.ok(timeline(p).dissolve <= 1); }
  } finally { terrain.dispose(); robot.dispose(); }
});
