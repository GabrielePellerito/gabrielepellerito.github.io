import { Vector3 } from 'three';
import { ease } from './timeline.js';
export function frameCinematicCamera(camera, state, site) {
  const portrait = camera.aspect < .85;
  const distance = Math.max(1, .95 / camera.aspect) * (portrait ? 1.12 : 1);
  const intro = new Vector3(-5.2 * distance, 5.6 + (distance - 1) * 1.3, 9.4 * distance);
  const working = new Vector3(site.center.x - 4 * distance, site.height + 4.8 * distance, site.center.z + 5.7 * distance);
  const destination = new Vector3(site.center.x + .05, site.height - .78, site.center.z + .04);
  camera.position.copy(intro).lerp(working, ease(state.progress, .18, .65));
  camera.position.lerp(destination, state.passage);
  const workingTarget = new Vector3(site.center.x - (portrait ? .65 : 0), site.height + .35, site.center.z - (portrait ? .12 : 0));
  const target = new Vector3(portrait ? 1.5 : .9, 1.75, portrait ? .9 : .65).lerp(workingTarget, ease(state.progress, .18, .65));
  target.lerp(new Vector3(site.center.x, site.height - 1.8, site.center.z), state.passage);
  camera.lookAt(target);
  // Optical framing shifts, rather than resizing the canvas on every scroll frame.
  const sensorWidth = 1000 * camera.aspect;
  camera.setViewOffset(sensorWidth, 1000, portrait ? 0 : -sensorWidth * .18 * (1 - ease(state.progress, .18, .4)), 0, sensorWidth, 1000);
  camera.updateProjectionMatrix();
}
