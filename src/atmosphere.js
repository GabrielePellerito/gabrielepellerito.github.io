import { Group, InstancedMesh, IcosahedronGeometry, MeshStandardMaterial, Object3D, Mesh, CylinderGeometry, ShaderMaterial, DoubleSide, AdditiveBlending, Points, BufferGeometry, Float32BufferAttribute, PointLight } from 'three';
import { timeline, clamp } from './timeline.js';
import { cuttingPoint } from './digging.js';
const random = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

export function createAtmosphere(site, robot, { lowPower = false } = {}) {
  const root = new Group(); root.name = 'DebrisAndLight';
  const number = lowPower ? 18 : 42;
  const fragmentGeometry = new IcosahedronGeometry(1, 0), fragmentMaterial = new MeshStandardMaterial({ color: 0x141617, roughness: .92, metalness: .08, envMapIntensity: .25 });
  const debris = new InstancedMesh(fragmentGeometry, fragmentMaterial, number); debris.castShadow = true; debris.frustumCulled = false; root.add(debris);
  const seeds = Array.from({ length: number }, (_, i) => {
    const birth = .36 + random(i + 3) * .17; robot.setPose(timeline(birth));
    return { birth, origin: cuttingPoint(robot), angle: random(i + 4) * Math.PI * 2, size: .018 + random(i + 5) * .045, speed: .4 + random(i + 6) * .6 };
  }); robot.setPose(timeline(0));
  const dummy = new Object3D();
  const beamGeometry = new CylinderGeometry(1.15, .36, 4.5, lowPower ? 24 : 48, 1, true);
  const beamMaterial = new ShaderMaterial({ transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending,
    uniforms: { amount: { value: 0 } },
    vertexShader: 'varying vec3 vLocal; void main(){ vLocal=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 vLocal; uniform float amount;
      void main(){ float h=(vLocal.y+2.25)/4.5; float a=atan(vLocal.z,vLocal.x);
      float streak=pow(.5+.5*sin(a*19.+sin(a*7.)*2.),12.);
      float fade=pow(1.-h,1.8)*smoothstep(0.,.12,h);
      gl_FragColor=vec4(vec3(.84),amount*fade*(.055+streak*.3)); }`
  });
  const beam = new Mesh(beamGeometry, beamMaterial); beam.position.copy(site.center); beam.position.y += 1.55; beam.scale.z = site.depthScale; root.add(beam);
  const coreGeometry = new CylinderGeometry(.66, .46, .7, 40, 1, true);
  const coreMaterial = new ShaderMaterial({ transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending,
    uniforms: { amount: { value: 0 } },
    vertexShader: 'varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 v;uniform float amount;void main(){float f=1.-smoothstep(-.35,.35,v.y);gl_FragColor=vec4(vec3(1.),amount*f*.65);}'
  });
  const core = new Mesh(coreGeometry, coreMaterial); core.position.copy(site.center); core.position.y -= .42; core.scale.z = site.depthScale; root.add(core);
  const light = new PointLight(0xffffff, 0, 11, 2); light.position.copy(site.center); light.position.y -= .26; root.add(light);
  const particleCount = lowPower ? 38 : 100, geometry = new BufferGeometry(), positions = new Float32Array(particleCount * 3), sizes = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) sizes[i] = 1.5 + random(i + 20) * 3;
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3)); geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1));
  const moteMaterial = new ShaderMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { amount: { value: 0 } },
    vertexShader: 'attribute float size;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=min(10.,size*7./max(1.,-p.z));}',
    fragmentShader: 'uniform float amount;void main(){float r=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(vec3(.92),amount*pow(max(0.,1.-r),2.));}'
  });
  const motes = new Points(geometry, moteMaterial); motes.frustumCulled = false; root.add(motes);
  function update(state) {
    for (let i = 0; i < number; i++) {
      const s = seeds[i], t = (state.progress - s.birth) * 5;
      dummy.position.copy(s.origin); dummy.position.x += Math.cos(s.angle) * t * s.speed; dummy.position.z += Math.sin(s.angle) * t * s.speed;
      dummy.position.y += 1.6 * t - 2.4 * t * t;
      dummy.rotation.set(t * 3 + i, t * 2, i); dummy.scale.setScalar(t >= 0 && t < 1.25 ? s.size * (1 - clamp((t - .9) / .35)) : 0);
      dummy.updateMatrix(); debris.setMatrixAt(i, dummy.matrix);
    }
    debris.instanceMatrix.needsUpdate = true; debris.visible = state.progress > .35 && state.progress < .8;
    const amount = state.light * (1 - state.dissolve * .5);
    beamMaterial.uniforms.amount.value = amount; coreMaterial.uniforms.amount.value = amount;
    beam.visible = core.visible = motes.visible = amount > .0001; light.intensity = amount * 28;
    moteMaterial.uniforms.amount.value = amount * .85;
    for (let i = 0; i < particleCount; i++) {
      const a = random(i + 7) * Math.PI * 2 + state.light * .35, r = Math.sqrt(random(i + 11)) * .8;
      positions[i * 3] = site.center.x + Math.cos(a) * r;
      positions[i * 3 + 1] = site.height - .6 + random(i + 12) * 3.5 * state.light;
      positions[i * 3 + 2] = site.center.z + Math.sin(a) * r * site.depthScale;
    }
    geometry.attributes.position.array.set(positions); geometry.attributes.position.needsUpdate = true;
  }
  return { root, update, dispose() {
    debris.dispose(); for (const g of [fragmentGeometry, beamGeometry, coreGeometry, geometry]) g.dispose();
    for (const m of [fragmentMaterial, beamMaterial, coreMaterial, moteMaterial]) m.dispose(); root.removeFromParent();
  } };
}
