// Shared mechanics, theme-specific studio lighting. Rendering is strictly on demand.
import { WebGLRenderer, Scene, PerspectiveCamera, Mesh, PlaneGeometry, ShadowMaterial, DirectionalLight, PMREMGenerator, ACESFilmicToneMapping, PCFShadowMap } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createRobot } from './robot.js';

export function createScene(mount, { lowPower = false } = {}) {
  const light = mount.closest('[data-concept]')?.dataset.concept === 'light-minimal-3d';
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false });
  if (!context) return null;
  let renderer;
  try { renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true }); } catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1.25 : 1.65));
  renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = light ? .98 : 1.08;
  renderer.setClearColor(light ? 0xf7f7f5 : 0x080808, 0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFShadowMap;
  const scene = new Scene(); const camera = new PerspectiveCamera(32, 1, .1, 60);
  const robot = createRobot({ light, lowPower }); scene.add(robot.root);
  const room = new RoomEnvironment(); const pmrem = new PMREMGenerator(renderer);
  let environmentTarget = pmrem.fromScene(room, .055);
  scene.environment = environmentTarget.texture; scene.environmentIntensity = light ? .7 : .65;
  const key = new DirectionalLight(0xffffff, light ? 2.4 : 4.4); key.position.set(-3, 8, 5); scene.add(key);
  key.castShadow = true; key.shadow.mapSize.setScalar(lowPower ? 512 : 1024);
  Object.assign(key.shadow.camera, { left: -3.5, right: 3.5, top: 5, bottom: -2.5, near: .1, far: 20 });
  key.shadow.camera.updateProjectionMatrix(); key.shadow.bias = -.0005; key.shadow.normalBias = .025; key.shadow.radius = light ? 6 : 3;
  const rim = new DirectionalLight(0xffffff, light ? 2 : 5.8); rim.position.set(3, 5, -3); scene.add(rim);
  const fill = new DirectionalLight(0xffffff, light ? .65 : .4); fill.position.set(2, 1, 5); scene.add(fill);
  const floor = new Mesh(new PlaneGeometry(12, 12), new ShadowMaterial({ opacity: light ? .10 : .32 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.002; floor.receiveShadow = true; scene.add(floor);
  let disposed = false, lost = false, progress = 0, width = 0, height = 0, renderCount = 0;
  function frameCamera() {
    const distance = 8.9 * Math.max(1, .9 / camera.aspect);
    camera.position.set(3.5 / 8.9 * distance + progress * .18, 2.9, 7.9 / 8.9 * distance);
    camera.lookAt(-.18, 1.95, 0); camera.updateProjectionMatrix();
  }
  function draw() { if (!disposed && !lost) { renderer.render(scene, camera); renderCount++; } }
  function resize() {
    if (disposed) return;
    const w = Math.max(1, mount.clientWidth), h = Math.max(1, mount.clientHeight);
    if (w === width && h === height) return; width = w; height = h;
    renderer.setSize(w, h, false); camera.aspect = w / h; frameCamera(); draw();
  }
  const observer = new ResizeObserver(resize); observer.observe(mount);
  const stage = mount.parentElement;
  const onLost = (event) => { event.preventDefault(); lost = true; stage.classList.remove('scene-ready'); stage.dataset.renderer = 'fallback'; };
  const onRestored = () => {
    if (disposed) return;
    // Render targets have no CPU pixels: regenerate PMREM after actual context loss.
    environmentTarget.dispose(); environmentTarget = pmrem.fromScene(room, .055); scene.environment = environmentTarget.texture;
    lost = false; draw(); stage.classList.add('scene-ready'); stage.dataset.renderer = 'webgl';
  };
  canvas.addEventListener('webglcontextlost', onLost); canvas.addEventListener('webglcontextrestored', onRestored);
  mount.append(canvas);
  function setProgress(value) {
    if (disposed) return;
    progress = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
    robot.setProgress(progress); frameCamera(); stage.dataset.rotation = robot.state.base.toFixed(4); draw();
  }
  resize(); setProgress(0);
  return { setProgress,
    get progress() { return progress; },
    // Read-only diagnostics for Playwright; no public UI/global is installed.
    get diagnostics() { return { ...robot.state, renderCount, lost, disposed, contextLost: context.isContextLost(), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, pixelRatio: renderer.getPixelRatio() }; },
    dispose() {
      if (disposed) return; disposed = true;
      observer.disconnect(); canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored);
      robot.dispose(); floor.geometry.dispose(); floor.material.dispose(); key.shadow.dispose();
      scene.environment = null; environmentTarget.dispose(); pmrem.dispose(); room.dispose();
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    }
  };
}
