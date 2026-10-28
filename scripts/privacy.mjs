import { spawnSync } from 'node:child_process';
export const privateSource = 'assets/contenuti-cv-sito-gabriele.md';
// Windows paths are case-insensitive; match encoded/nested requests after decoding.
export const isPrivatePath = (pathname) => pathname.toLowerCase().split(/[\\/]/).some((part) => part.startsWith('contenuti-cv-sito-gabriele'));
export function assertPrivateSourceNotTracked(root) {
  const result = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error('Impossibile verificare la riservatezza dei file tracciati.');
  if (result.stdout.split('\0').some(isPrivatePath)) throw new Error('Il documento privato è tracciato: rimuovilo dall’indice senza cancellarlo localmente.');
}
