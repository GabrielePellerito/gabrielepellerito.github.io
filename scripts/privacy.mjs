import { spawnSync } from 'node:child_process';
export const privateSource = 'assets/contenuti-cv-sito-gabriele.md';
// Windows paths are case-insensitive; match encoded/nested requests after decoding.
export const referenceFiles = ['braccio-originale-1.png', 'braccio-originale-2.png', 'braccio-robotico-reference.png', 'img_0259.jpg', 'img_0261.jpg', 'infografica tecnica del braccio robotico diy.png'];
export const isPrivatePath = (pathname) => pathname.toLowerCase().split(/[\\/]/).some((part) => part.startsWith('contenuti-cv-sito-gabriele') || referenceFiles.some((file) => part === file || part.startsWith(file + '.')));
export function assertPrivateSourceNotTracked(root) {
  const result = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error('Impossibile verificare la riservatezza dei file tracciati.');
  if (result.stdout.split('\0').some(isPrivatePath)) throw new Error('Il documento privato è tracciato: rimuovilo dall’indice senza cancellarlo localmente.');
}
