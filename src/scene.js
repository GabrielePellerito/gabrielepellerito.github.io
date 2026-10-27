// Light concept: suspended architectural portals. Intentionally different topology.
import { WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshStandardMaterial, Shape, Path, ExtrudeGeometry, IcosahedronGeometry, DirectionalLight, PMREMGenerator, ACESFilmicToneMapping } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function roundedRect(path, x, y, width, height, radius) {
  path.moveTo(x + radius, y); path.lineTo(x + width - radius, y);
  path.quadraticCurveTo(x + width, y, x + width, y + radius);
  path.lineTo(x + width, y + height - radius); path.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  path.lineTo(x + radius, y + height); path.quadraticCurveTo(x, y + height, x, y + height - radius);
  path.lineTo(x, y + radius); path.quadraticCurveTo(x, y, x + radius, y);
  return path;
}
export function createScene(mount, { lowPower = false } = {}) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false });
  if (!context) return null;
  let renderer;
  try { renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true }); } catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1.25 : 1.65));
  renderer.setClearColor(0xf7f7f5, 0); renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new Scene(); const camera = new PerspectiveCamera(32, 1, .1, 50); camera.position.set(0, .2, 9.3);
  const environment = new RoomEnvironment(); const generator = new PMREMGenerator(renderer);
  const environmentTarget = generator.fromScene(environment, .025);
  scene.environment = environmentTarget.texture; scene.environmentIntensity = 1;
  environment.dispose(); generator.dispose();
  const chrome = new MeshStandardMaterial({ color: 0xaaaaaa, roughness: .12, metalness: 1, envMapIntensity: 1.15 });
  const porcelain = new MeshStandardMaterial({ color: 0xeeeeee, roughness: .42, metalness: .08 });
  const graphite = new MeshStandardMaterial({ color: 0x272727, roughness: .28, metalness: .65 });
  const shape = roundedRect(new Shape(), -1.15, -1.15, 2.3, 2.3, .12);
  shape.holes.push(roundedRect(new Path(), -.77, -.77, 1.54, 1.54, .06));
  const geometry = new ExtrudeGeometry(shape, { depth: .38, bevelEnabled: true, bevelSegments: lowPower ? 2 : 4, steps: 1, bevelSize: .055, bevelThickness: .055, curveSegments: lowPower ? 5 : 10 });
  geometry.translate(0, 0, -.19);
  const sculpture = new Group();
  const upper = new Mesh(geometry, [chrome, chrome]); upper.position.set(-.45, .96, -.15); upper.rotation.set(.1, .45, -.16); sculpture.add(upper);
  const lower = new Mesh(geometry, [porcelain, chrome]); lower.position.set(.44, -.88, .18); lower.rotation.set(-.18, -.6, .22); sculpture.add(lower);
  const core = new Mesh(new IcosahedronGeometry(.43, 0), graphite); core.position.set(.45, .48, .9); core.rotation.set(.25, .4, .15); sculpture.add(core);
  scene.add(sculpture);
  const key = new DirectionalLight(0xffffff, 3.2); key.position.set(-4, 5, 5); scene.add(key);
  const rim = new DirectionalLight(0xffffff, 2); rim.position.set(4, -2, -3); scene.add(rim);
  let disposed = false, lost = false, progress = 0, width = 0, height = 0;
  function draw() { if (!disposed && !lost) renderer.render(scene, camera); }
  function resize() {
    if (disposed) return;
    const w = Math.max(1, mount.clientWidth), h = Math.max(1, mount.clientHeight);
    if (w === width && h === height) return; width = w; height = h;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); draw();
  }
  const observer = new ResizeObserver(resize); observer.observe(mount);
  const onLost = (event) => { event.preventDefault(); lost = true; mount.parentElement.classList.remove('scene-ready'); mount.parentElement.dataset.renderer = 'fallback'; };
  const onRestored = () => { lost = false; draw(); mount.parentElement.classList.add('scene-ready'); mount.parentElement.dataset.renderer = 'webgl'; };
  canvas.addEventListener('webglcontextlost', onLost); canvas.addEventListener('webglcontextrestored', onRestored);
  mount.append(canvas);
  function setProgress(value) {
    if (disposed) return; progress = value;
    sculpture.rotation.set(.13 + value * .5, -.27 + value * 1.5, -.06 - value * .2);
    sculpture.position.set(value * .35, -.05 + value * .35, value * .65);
    sculpture.scale.setScalar(.98 - value * .1);
    upper.rotation.z = -.16 + value * .23; lower.rotation.y = -.6 - value * .45;
    core.position.z = .9 + value * .55; core.rotation.y = .4 + value * 1.2;
    camera.position.x = -.1 + value * .38; camera.lookAt(0, .05 + value * .15, 0);
    mount.parentElement.dataset.rotation = sculpture.rotation.y.toFixed(4); draw();
  }
  resize(); setProgress(0);
  return {
    setProgress,
    dispose() { if (disposed) return; disposed = true; observer.disconnect(); canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored); geometry.dispose(); core.geometry.dispose(); chrome.dispose(); porcelain.dispose(); graphite.dispose(); environmentTarget.dispose(); scene.environment = null; renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); },
    get progress() { return progress; }
  };
}
