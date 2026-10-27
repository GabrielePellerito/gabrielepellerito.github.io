// On-demand WebGL scene. No animation clock or perpetual render loop.
import { WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshStandardMaterial, TorusKnotGeometry, TorusGeometry, DirectionalLight, PMREMGenerator, ACESFilmicToneMapping } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createScene(mount, { lowPower = false } = {}) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: !lowPower, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false });
  if (!context) return null;
  let renderer;
  try { renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: !lowPower }); } catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1.25 : 1.65));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = .9;
  renderer.setClearColor(0x080808, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, .1, 50);
  camera.position.set(0, 0, 7.9);
  const environment = new RoomEnvironment();
  const generator = new PMREMGenerator(renderer);
  const environmentTarget = generator.fromScene(environment, .035);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = .85;
  environment.dispose(); generator.dispose();
  const sculpture = new Group();
  const chrome = new MeshStandardMaterial({ color: 0xb8b8b8, metalness: 1, roughness: .1, envMapIntensity: 1.1 });
  const satin = new MeshStandardMaterial({ color: 0x8e8e8e, metalness: 1, roughness: .3, envMapIntensity: 1.4 });
  const knot = new Mesh(new TorusKnotGeometry(1.28, .34, lowPower ? 100 : 180, lowPower ? 12 : 22, 2, 3), chrome);
  knot.rotation.z = -.2;
  sculpture.add(knot);
  const orbit = new Mesh(new TorusGeometry(2.05, .012, 6, 110), satin);
  orbit.rotation.set(1.12, .4, .1); sculpture.add(orbit);
  scene.add(sculpture);
  const key = new DirectionalLight(0xffffff, 4); key.position.set(-3, 5, 5); scene.add(key);
  const rim = new DirectionalLight(0xffffff, 6); rim.position.set(5, -1, -3); scene.add(rim);
  let disposed = false, lost = false, progress = 0;
  let width = 0, height = 0;
  function draw() { if (!disposed && !lost) renderer.render(scene, camera); }
  function resize() {
    if (disposed) return;
    const nextWidth = Math.max(1, mount.clientWidth), nextHeight = Math.max(1, mount.clientHeight);
    if (width === nextWidth && height === nextHeight) return;
    width = nextWidth; height = nextHeight;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); draw();
  }
  const observer = new ResizeObserver(resize); observer.observe(mount);
  const onLost = (event) => { event.preventDefault(); lost = true; mount.parentElement.classList.remove('scene-ready'); mount.parentElement.dataset.renderer = 'fallback'; };
  const onRestored = () => { lost = false; draw(); mount.parentElement.classList.add('scene-ready'); mount.parentElement.dataset.renderer = 'webgl'; };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  mount.append(canvas);
  function setProgress(value) {
    if (disposed) return;
    progress = value;
    sculpture.rotation.set(.28 + value * .9, -.45 + value * 2.1, -.22 + value * .3);
    sculpture.position.set(value * .25, value * .45, value * .35);
    sculpture.scale.setScalar(1 - value * .12);
    camera.position.x = value * .28;
    camera.lookAt(0, value * .12, 0);
    mount.parentElement.dataset.rotation = sculpture.rotation.y.toFixed(4);
    draw();
  }
  resize(); setProgress(0);
  return {
    setProgress,
    dispose() {
      if (disposed) return; disposed = true;
      observer.disconnect(); canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored);
      scene.traverse((object) => { object.geometry?.dispose(); });
      chrome.dispose(); satin.dispose(); environmentTarget.dispose(); scene.environment = null;
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    },
    get progress() { return progress; }
  };
}
