// Read-only account check. Credentials remain in memory and are never logged.
import { spawnSync } from 'node:child_process';

if (process.argv[2] !== 'status') throw new Error('Comando previsto: node scripts/github.mjs status');
const result = spawnSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' }, timeout: 15000, windowsHide: true });
const password = result.stdout?.split(/\r?\n/).find((line) => line.startsWith('password='))?.slice(9);
if (!password) { console.log('Nessuna credenziale GitHub utilizzabile in modo non interattivo.'); process.exit(0); }
const headers = { Authorization: `Bearer ${password}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'personal-site-local-check' };
const response = await fetch('https://api.github.com/user', { headers });
if (!response.ok) { console.log(`Autenticazione GitHub non verificata (HTTP ${response.status}).`); process.exit(0); }
const user = await response.json();
console.log(`Accesso GitHub verificato: ${user.login}. Nessuna modifica remota eseguita.`);
for (const name of [`${user.login.toLowerCase()}.github.io`, 'gabrielepellerito.com']) {
  const repo = await fetch(`https://api.github.com/repos/${user.login}/${name}`, { headers });
  console.log(`${name}: ${repo.status === 404 ? 'non esiste; nome disponibile nell’account' : repo.ok ? 'repository già esistente; da preservare' : `verifica HTTP ${repo.status}`}`);
}
