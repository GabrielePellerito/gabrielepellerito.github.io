import { Group, Mesh, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, MeshBasicMaterial, CircleGeometry, DoubleSide, LineSegments, LineBasicMaterial } from 'three';

export function createTerrain(site, { lowPower = false } = {}) {
  const root = new Group(); root.name = 'ExcavationBank'; root.position.copy(site.center);
  // A shallow work bank leaves the servo, rear flange and main plank outside
  // its rear face. The opening stays centred on the measured cutting nose.
  root.scale.z = site.depthScale;
  const count = lowPower ? 48 : 80, bands = 6;
  const rock = new MeshStandardMaterial({ color: 0x0b0c0d, roughness: .98, metalness: .04, envMapIntensity: .12, vertexColors: true, side: DoubleSide });
  const wallMaterial = new MeshStandardMaterial({ color: 0x080909, roughness: 1, envMapIntensity: .12, side: DoubleSide, vertexColors: true });
  function surface(rows, material, name) {
    const geometry = new BufferGeometry(), positions = new Float32Array((count + 1) * rows * 3), colors = positions.slice(), indices = [];
    for (let j = 0; j < rows - 1; j++) for (let i = 0; i < count; i++) {
      const a = j * (count + 1) + i, b = a + count + 1; indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = colors[i + 1] = colors[i + 2] = .85;
    }
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3)); geometry.setAttribute('color', new Float32BufferAttribute(colors, 3)); geometry.setIndex(indices);
    const mesh = new Mesh(geometry, material); mesh.name = name; mesh.receiveShadow = true; mesh.castShadow = true; root.add(mesh);
    return { mesh, geometry, positions: geometry.attributes.position.array };
  }
  const top = surface(bands + 1, rock, 'FracturedSurface'), wall = surface(5, wallMaterial, 'CavityWalls'), outer = surface(2, rock, 'BankSides');
  const irregularity = a => 1 + .09 * Math.sin(a * 7 + .7) + .045 * Math.cos(a * 13);
  const rim = a => site.radius / Math.pow(Math.abs(Math.cos(a)) ** 6 + Math.abs(Math.sin(a)) ** 6, 1 / 6) * (1 + .012 * Math.sin(a * 17));
  const bottomMaterial = new MeshBasicMaterial({ color: 0x020303, side: DoubleSide });
  const bottom = new Mesh(new CircleGeometry(1.2, count), bottomMaterial); bottom.rotation.x = -Math.PI / 2; bottom.position.y = -site.depth; root.add(bottom);
  const crackPoints = [];
  for (let branch = 0; branch < 9; branch++) {
    const angle = branch * Math.PI * 2 / 9 + .18 * Math.sin(branch * 23);
    for (let i = 0; i < 5; i++) {
      for (const k of [i, i + 1]) { const r = .55 + k * .17, a = angle + Math.sin(k * 2 + branch) * .06; crackPoints.push(Math.cos(a) * r, .012, Math.sin(a) * r); }
    }
  }
  const crackGeometry = new BufferGeometry(); crackGeometry.setAttribute('position', new Float32BufferAttribute(crackPoints, 3));
  const crackMaterial = new LineBasicMaterial({ color: 0x030303, transparent: true });
  const cracks = new LineSegments(crackGeometry, crackMaterial); root.add(cracks);
  let radius = 0, previousOpening = -1;
  function update({ opening }) {
    if (opening === previousOpening) return; previousOpening = opening;
    radius = .002 + opening * .96;
    for (let j = 0; j <= bands; j++) for (let i = 0; i <= count; i++) {
      const a = i / count * Math.PI * 2, t = j / bands, r = radius * irregularity(a) * (1 - t) + rim(a) * t;
      const at = (j * (count + 1) + i) * 3;
      top.positions[at] = Math.cos(a) * r; top.positions[at + 2] = Math.sin(a) * r;
      top.positions[at + 1] = opening * (1 - t) * (.045 * Math.sin(a * 11) - .04) + .008 * t * Math.sin(a * 9);
      const shade = .8 + .1 * Math.sin(top.positions[at] * 7) * Math.cos(top.positions[at + 2] * 8);
      top.geometry.attributes.color.array.fill(shade, at, at + 3);
    }
    for (let j = 0; j < 5; j++) for (let i = 0; i <= count; i++) {
      const a = i / count * Math.PI * 2, t = j / 4, r = radius * irregularity(a) * (1 - t * .26);
      const at = (j * (count + 1) + i) * 3;
      wall.positions[at] = Math.cos(a) * r; wall.positions[at + 2] = Math.sin(a) * r;
      wall.positions[at + 1] = -site.depth * t + (1 - t) * opening * (.055 * Math.sin(a * 11) - .04);
    }
    for (let j = 0; j < 2; j++) for (let i = 0; i <= count; i++) {
      const a = i / count * Math.PI * 2, r = rim(a) * (j ? .94 : 1), at = (j * (count + 1) + i) * 3;
      outer.positions[at] = Math.cos(a) * r; outer.positions[at + 2] = Math.sin(a) * r; outer.positions[at + 1] = j ? -site.height : .008 * Math.sin(a * 9);
      outer.geometry.attributes.color.array.fill(j ? .035 : .7, at, at + 3);
    }
    for (const item of [top, wall, outer]) { item.geometry.attributes.position.needsUpdate = true; item.geometry.attributes.color.needsUpdate = true; item.geometry.computeVertexNormals(); item.geometry.computeBoundingSphere(); }
    let vertex = 0;
    for (let branch = 0; branch < 9; branch++) {
      const angle = branch * Math.PI * 2 / 9 + .18 * Math.sin(branch * 23);
      for (let i = 0; i < 5; i++) for (const k of [i, i + 1]) {
        const t = k / 5, a = angle + Math.sin(k * 2 + branch) * .06;
        const r = (radius * irregularity(a) + .035) * (1 - t) + rim(a) * .93 * t;
        crackGeometry.attributes.position.setXYZ(vertex++, Math.cos(a) * r, .012, Math.sin(a) * r);
      }
    }
    crackGeometry.attributes.position.needsUpdate = true; crackGeometry.computeBoundingSphere();
    cracks.visible = opening > .15; crackMaterial.opacity = Math.min(1, opening * 2); bottom.visible = opening > .001;
  }
  update({ opening: 0 });
  return { root, update, get radius() { return radius; }, dispose() {
    for (const item of [top, wall, outer]) item.geometry.dispose(); crackGeometry.dispose(); bottom.geometry.dispose();
    rock.dispose(); wallMaterial.dispose(); crackMaterial.dispose(); bottomMaterial.dispose(); root.removeFromParent();
  } };
}
