// Pure, time-independent choreography. Angles are artistic display limits,
// NOT measured hardware limits. No extra degree of freedom is introduced.
export const clamp = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
export const ease = (p, a, b) => { const t = clamp((p - a) / (b - a)); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => a + (b - a) * t;
const keys = [
  [0, 0, -14, 14], [.15, 0, -14, 14], [.35, 10, -85, -12],
  [.51, 10, -91, -25], [.61, 10, -63, 16], [.72, 10, -45, 12],
  [.88, 10, -45, 12], [1, 10, -45, 12]
];
export function timeline(value) {
  const progress = clamp(value);
  let i = 0; while (i < keys.length - 2 && progress > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1], t = ease(progress, a[0], b[0]);
  const [base, arm, shovel] = [1, 2, 3].map(k => mix(a[k], b[k], t) * Math.PI / 180);
  return { progress, base, arm, shovel,
    preparation: ease(progress, .15, .35), excavation: ease(progress, .35, .55),
    opening: .22 * ease(progress, .35, .55) + .78 * ease(progress, .55, .72),
    light: ease(progress, .72, .88), passage: ease(progress, .88, 1),
    title: 1 - ease(progress, .18, .33), dissolve: ease(progress, .94, 1),
    phase: progress < .15 ? 0 : progress < .35 ? 1 : progress < .55 ? 2 : progress < .72 ? 3 : progress < .88 ? 4 : 5
  };
}
