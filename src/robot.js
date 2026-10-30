// Main structure: dimensionless reconstruction from IMG_0259.JPG / IMG_0261.JPG.
// Terminal tray/mount: definitive "Braccio meccanico con vaschetta rialzata" reference.
// No measurement, actuator specification or unseen electronics is inferred.
import { Group, Mesh, MeshStandardMaterial, BoxGeometry, CylinderGeometry, CatmullRomCurve3, TubeGeometry, Vector3, BufferGeometry, Float32BufferAttribute } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const rad = Math.PI / 180;
const smooth = (p, a, b) => { const t = Math.min(1, Math.max(0, (p - a) / (b - a))); return t * t * (3 - 2 * t); };
export function poseForProgress(value) {
  const p = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  // Conservative DISPLAY ranges, not measured limits of the real prototype.
  return { progress: p, base: (48 * smooth(p, 0, .25) - 10 * smooth(p, .82, 1)) * rad,
    arm: (-14 + 15 * smooth(p, .25, .55) - 3 * smooth(p, .82, 1)) * rad,
    shovel: (14 - 30 * smooth(p, .5, .78) + 4 * smooth(p, .82, 1)) * rad };
}

export function createRobot({ light = false, lowPower = false } = {}) {
  const geometries = new Set(), materials = new Set();
  const material = (color, metalness, roughness) => { const m = new MeshStandardMaterial({ color, metalness, roughness }); materials.add(m); return m; };
  const panel = material(light ? 0xdededa : 0x242729, light ? .12 : .38, .4);
  const edge = material(light ? 0x969895 : 0x17191b, .28, .56);
  const laminate = material(light ? 0xbfc1be : 0x5d6062, .35, .48);
  const silver = material(0xbfc3c5, .85, .25);
  const graphite = material(0x171a1d, .3, .36);
  const cableMat = [material(0x202225, .05, .7), material(0x797b7c, .15, .55), material(0xbfc0be, .15, .5)];
  const geometry = (g) => { geometries.add(g); return g; };
  const group = (name, parent, position = [0, 0, 0]) => { const g = new Group(); g.name = name; g.position.set(...position); parent?.add(g); return g; };
  const mesh = (parent, name, geo, mat, position = [0, 0, 0]) => { const m = new Mesh(geo, mat); m.name = name; m.position.set(...position); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const box = (parent, name, size, pos, mat = panel, round = .012) => mesh(parent, name, geometry(round ? new RoundedBoxGeometry(...size, lowPower ? 1 : 2, round) : new BoxGeometry(...size)), mat, pos);
  const cylinder = (parent, name, r, length, pos, mat = silver, axis = 'y', sides = 20) => {
    const m = mesh(parent, name, geometry(new CylinderGeometry(r, r, length, lowPower ? Math.min(sides, 12) : sides)), mat, pos);
    if (axis === 'z') m.rotation.x = Math.PI / 2;
    if (axis === 'x') m.rotation.z = Math.PI / 2;
    return m;
  };
  const screwGeo = geometry(new CylinderGeometry(.024, .024, .016, lowPower ? 6 : 10));
  const slotGeo = geometry(new BoxGeometry(.028, .003, .004));
  const screw = (parent, x, y, z, axis = 'z') => {
    const holder = group('Fastener', parent, [x, y, z]);
    if (axis === 'z') holder.rotation.x = Math.PI / 2;
    if (axis === 'x') holder.rotation.z = Math.PI / 2;
    mesh(holder, 'ScrewHead', screwGeo, silver);
    mesh(holder, 'ScrewSlot', slotGeo, graphite, [0, .009, 0]);
  };
  const wire = (parent, name, points, mat, radius = .011) => mesh(parent, name, geometry(new TubeGeometry(new CatmullRomCurve3(points.map((p) => new Vector3(...p))), lowPower ? 16 : 28, radius, lowPower ? 4 : 6, false)), mat);

  const root = group('RobotRoot');
  const fixed = group('StationaryBase', root);
  // Photos show a closed wooden box. The stepper is housed inside it;
  // its unseen mounting and output shaft are plausible approximations.
  box(fixed, 'BaseFrontPanel', [1.46, .66, .045], [0, .36, .535]);
  box(fixed, 'BaseRearPanel', [1.46, .66, .045], [0, .36, -.535]);
  for (const x of [-.71, .71]) box(fixed, 'BaseSidePanel', [.045, .66, 1.03], [x, .36, 0]);
  box(fixed, 'BaseBottom', [1.5, .045, 1.13], [0, .028, 0], edge);
  box(fixed, 'BaseLid', [1.51, .045, 1.14], [0, .712, 0]);
  box(fixed, 'BaseLidLamination', [1.52, .012, 1.15], [0, .687, 0], laminate, .003);
  for (const x of [-.63, .63]) for (const z of [-.46, .46]) screw(fixed, x, .744, z, 'y');
  const stepper = group('StepperMotor', fixed, [0, .49, 0]);
  box(stepper, 'StepperBody', [.46, .34, .46], [0, 0, 0], graphite);
  box(stepper, 'StepperEndCap', [.48, .05, .48], [0, .195, 0], silver);
  cylinder(stepper, 'StepperOutputShaft', .055, .26, [0, .27, 0]);
  cylinder(fixed, 'BaseBearing', .23, .065, [0, .756, 0], silver);

  const basePivot = group('BaseRotationPivot', root, [0, .795, 0]);
  const rotating = group('RotatingStructure', basePivot);
  box(rotating, 'TurntablePlate', [1.23, .065, .98], [0, .04, 0]);
  box(rotating, 'TurntableEdge', [1.24, .013, .99], [0, .003, 0], laminate, .003);
  for (let i = 0; i < 7; i++) {
    const layer = box(rotating, 'PedestalLayer', [.54 + (i % 2) * .018, .055, .51], [-.18, .11 + i * .061, .12], i % 2 ? edge : laminate, .004);
    layer.rotation.y = (i % 3 - 1) * .012;
  }
  const servo = (parent, name, position, vertical) => {
    const s = group(name, parent, position);
    box(s, 'ServoHousing', vertical ? [.29, .47, .24] : [.48, .29, .24], [0, 0, 0], graphite);
    box(s, 'ServoSeam', vertical ? [.302, .027, .247] : [.027, .302, .247], vertical ? [0, .12, 0] : [.12, 0, 0], edge, .004);
    for (const y of [-1, 1]) box(s, 'ServoMountTab', [.36, .043, .055], [0, y * (vertical ? .245 : .165), -.06], graphite, .003);
    for (const x of [-1, 1]) for (const y of [-1, 1]) screw(s, x * (vertical ? .11 : .20), y * (vertical ? .19 : .105), .133);
    return s;
  };
  servo(rotating, 'ArmServomotor', [-.18, .64, .25], false);
  cylinder(rotating, 'ArmOutputShaft', .052, .18, [.015, .715, .33], silver, 'z');
  const armPivot = group('ArmServoPivot', rotating, [.015, .715, .04]);
  const arm = group('ArmAssembly', armPivot);
  // Broad laminated plank, not an industrial tubular link.
  for (let i = 0; i < 5; i++) box(arm, 'ArmLamination', [.395, 2.48, .026], [0, 1.10, -.07 + i * .029], i === 4 ? panel : i % 2 ? edge : laminate, .004);
  cylinder(arm, 'ArmServoHorn', .10, .022, [0, 0, .345], silver, 'z');
  box(arm, 'ArmHornLink', [.075, .30, .026], [0, .11, .352], silver, .014);
  cylinder(arm, 'ArmHornSpacer', .025, .29, [0, .23, .20], silver, 'z');
  screw(arm, 0, 0, .373); screw(arm, 0, .23, .373);
  for (const y of [.55, 1.38, 2.26]) for (const x of [-.145, .145]) screw(arm, x, y, .074);
  servo(arm, 'ShovelServomotor', [0, 2.035, .205], true);
  cylinder(arm, 'ShovelOutputShaft', .05, .16, [0, 1.91, .355], silver, 'z');
  const shovelPivot = group('ShovelServoPivot', arm, [0, 1.91, .40]);
  const mountingPlate = group('MountingPlate', shovelPivot);
  cylinder(mountingPlate, 'ShovelServoHorn', .086, .025, [0, 0, .015], silver, 'z');
  // Short coaxial standoff connects the horn to the visible front mounting plate.
  // Hidden fastening dimensions are approximations, not prototype measurements.
  cylinder(mountingPlate, 'ShovelHornStandoff', .052, .035, [0, 0, .043], silver, 'z');
  // Folded mounting plate: drive web in XY, full rear attachment face in YZ.
  // The shaft is local Z; the tray extends along -X, never along the shaft.
  // Contact planes coincide at x=-.255. No decorative gap or independent pivot.
  box(mountingPlate, 'ServoDrivePlate', [.30, .34, .045], [-.07, .01, .065], panel, 0);
  box(mountingPlate, 'MountingPlateSurface', [.035, .30, .86], [-.2375, -.02, .47], panel, 0);
  screw(mountingPlate, 0, 0, .098);
  screw(mountingPlate, -.14, .11, .098);
  const shovel = group('ShovelAssembly', mountingPlate);
  // Shallow OPEN tray: lower interior, raised side/rear rims and rounded free end.
  // The old rolled convex arch is replaced, not merely rotated. Dimensions are
  // display proportions; hidden fixing details are not measured specifications.
  const rearX = -.255, length = 1.40, halfWidth = .43, centerZ = .47;
  const rimY = .08, depth = .16, thickness = .028, cornerRadius = .13;
  const nx = lowPower ? 20 : 36, nz = lowPower ? 12 : 22;
  const positions = [], indices = [], row = nz + 1, surface = (nx + 1) * row;
  for (let side = 0; side < 2; side++) for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
    const t = i / nx, v = j / nz * 2 - 1;
    const fromFreeEnd = (1 - t) * length;
    const width = fromFreeEnd < cornerRadius ? halfWidth - cornerRadius + Math.sqrt(cornerRadius ** 2 - (cornerRadius - fromFreeEnd) ** 2) : halfWidth;
    const endRise = t ** 10 + (1 - t) ** 10;
    const sideRise = v ** 6;
    const rise = 1 - (1 - endRise) * (1 - sideRise);
    positions.push(rearX - t * length, rimY - depth + depth * rise - side * thickness, centerZ + v * width);
  }
  for (let side = 0; side < 2; side++) for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const a = side * surface + i * row + j, b = a + row;
    indices.push(...(side ? [a, a + 1, b, b, a + 1, b + 1] : [a, b, a + 1, b, b + 1, a + 1]));
  }
  const seam = (a, b) => indices.push(a, b, a + surface, b, b + surface, a + surface);
  for (let i = 0; i < nx; i++) { seam(i * row, (i + 1) * row); seam((i + 1) * row + nz, i * row + nz); }
  for (let j = 0; j < nz; j++) { seam(j + 1, j); seam(nx * row + j, nx * row + j + 1); }
  const shell = geometry(new BufferGeometry()); shell.setAttribute('position', new Float32BufferAttribute(positions, 3)); shell.setIndex(indices); shell.computeVertexNormals();
  mesh(shovel, 'CurvedShovel', shell, panel);
  // Rear flange's whole right face is flush against the plate's left face.
  // Its screws run along X through this interface; the servo still rotates on Z.
  box(shovel, 'RearAttachmentEdge', [.035, .188, .86], [rearX - .0175, -.014, centerZ], panel, 0);
  box(shovel, 'FreeFrontEdge', [.026, .028, (halfWidth - cornerRadius) * 2], [rearX - length, rimY - .014, centerZ], laminate, .009);
  for (const z of [.18, .76]) screw(shovel, rearX - .042, .048, z, 'x');
  group('RearAttachmentDatum', shovel, [rearX, rimY, centerZ]);
  for (let i = 0; i < 3; i++) {
    const dx = i * .025;
    wire(arm, 'TerminalServoCable', [[.13 + dx, 2.17, .09], [.25 + dx, 1.91, .07], [.29 + dx, 1.13, .03], [.25 + dx, .44, .03], [.18 + dx, 0, .01], [.12 + dx, -.09, .02]], cableMat[i]);
    wire(rotating, 'ShoulderServiceLoop', [[.13 + dx, .64, .06], [.38 + dx, .42, .07], [.40 + dx, .15, .18], [.25 + dx, .09, .49], [-.37 + dx, .07, .50], [-.52 + dx, .05, .34]], cableMat[i]);
    wire(fixed, 'BaseSupplyCable', [[-.55, .81, .32 + dx], [-.79, .65, .39 + dx], [-.81, .32, .40 + dx], [-.77, .12, .39 + dx]], cableMat[i]);
  }
  for (const y of [.48, 1.22, 1.79]) box(arm, 'CableRetainer', [.11, .035, .085], [.255, y, .035], graphite, .004);
  const tip = group('ShovelTip', shovel, [rearX - length, rimY, centerZ]);
  let pose;
  function setProgress(p) { pose = poseForProgress(p); basePivot.rotation.y = pose.base; armPivot.rotation.z = pose.arm; shovelPivot.rotation.z = pose.shovel; root.updateMatrixWorld(true); }
  setProgress(0);
  return { root, joints: { basePivot, armPivot, shovelPivot }, setProgress,
    get state() { return { ...pose, tip: tip.getWorldPosition(new Vector3()).toArray(), rootRotation: root.rotation.toArray().slice(0, 3), basePosition: fixed.getWorldPosition(new Vector3()).toArray() }; },
    dispose() { for (const g of geometries) g.dispose(); for (const m of materials) m.dispose(); geometries.clear(); materials.clear(); root.removeFromParent(); }
  };
}
