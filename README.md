# Gabriele Pellerito — Dark Editorial 3D

Design selezionato per il sito ufficiale **https://gabrielepellerito.com/**, pubblicato da GitHub Pages tramite `main`. Il concept originale rimane nel branch `design/dark-editorial-3d`; la versione Light resta in `design/light-minimal-3d`. Entrambi sono nati dal commit **447a6a8**. Il backup `backup/versione-originale-2026-10-27`, il file `CNAME`, i DNS e la configurazione di Pages sono stati preservati.

## Direzione visiva

Nero profondo, bianco, grigi metallici. Nome monumentale e cognome a contorno, composizione asimmetrica, scultura cromata a nodo toroidale con orbita sottile, sezioni editoriali, timeline e card con profondità. Nessuna professione o esperienza è attribuita a Gabriele senza dati reali; i contenuti mancanti sono segnaposto espliciti.

## Avvio locale

Da questa cartella, con Node.js 22 o successivo:

```powershell
node scripts/serve.mjs
```

Apri **http://127.0.0.1:4174**. Non occorre installare dipendenze per l’anteprima: HTML, immagini e bundle WebGL sono già inclusi. Ferma il server con `Ctrl+C`. Per una porta diversa: `$env:PORT = '4180'` prima del comando.

I due checkout dei concept sono `concepts/dark-editorial-3d` e `concepts/light-minimal-3d`, ciascuno sul proprio branch. Il checkout `sito-pronto` contiene la versione ufficiale sul branch `main`.

Per lavorare da un clone nuovo:

```powershell
git clone https://github.com/GabrielePellerito/gabrielepellerito.github.io.git portfolio-concepts
cd portfolio-concepts
git switch design/dark-editorial-3d
node scripts/serve.mjs
```

Per cambiare concept in un clone ordinario, arresta il server, salva le modifiche, poi `git switch design/light-minimal-3d` e riavvia. Con i worktree già presenti Git impedisce di aprire lo stesso branch in due directory: usa direttamente il checkout corrispondente.

## Contenuti e progetti

**`content/site.json` è l’unica fonte dei contenuti.** Modifica biografia, percorso, competenze, interessi, progetti, email e social, poi:

```powershell
node scripts/update.mjs
node scripts/check.mjs
```

Imposta `placeholder: false` solo dopo aver inserito dati reali. Rimuovi `[Da completare]` dal testo e aggiorna le introduzioni che parlano dei segnaposto. Un’email vuota nasconde il pulsante; `contact.email` valorizzato genera un vero `mailto:`. Non viene simulato alcun invio.

Le schede progetto supportano i campi esistenti `title`, `description`, `category`, `tags`, `url`, `placeholder` e, facoltativamente:

```json
{
  "stack": ["Tecnologia realmente usata"],
  "githubUrl": "https://github.com/ACCOUNT/REPOSITORY",
  "demoUrl": "https://DEMO-PUBBLICA/",
  "year": "Periodo reale",
  "image": {
    "src": "./assets/anteprima.webp",
    "alt": "Descrizione pertinente dell’anteprima",
    "width": 1200,
    "height": 800
  }
}
```

Questo è uno schema di esempio, non un progetto personale. Senza `stack` si usano i `tags`; senza immagine appare una geometria decorativa, esplicitamente segnaposto. I link sono mostrati solo per schede non segnaposto. Immagini locali con dimensioni obbligatorie evitano richieste a terzi e riducono CLS; i collegamenti esterni devono essere HTTPS.

## 3D e movimento

**Three.js 0.186.1**, con licenza MIT inclusa, serve per geometria e materiali realmente tridimensionali. `src/scene.js` costruisce un `TorusKnotGeometry` metallico e un’orbita `TorusGeometry`, camera prospettica e luci neutre. `RoomEnvironment` e `PMREMGenerator` producono i riflessi in memoria, senza HDR, modelli o texture scaricati da servizi esterni. Materiale PBR `MeshStandardMaterial`, metalness 1, roughness 0.1.

`assets/main.js` normalizza lo scroll della hero in `[0, 1]` e interpola la posizione con `requestAnimationFrame`. Cambiano rotazioni X/Y/Z, posizione, scala e camera. Non c’è auto-rotazione: a posizione stabilizzata il ciclo si ferma. WebGL è caricato **al primo scroll**, per non ritardare il contenuto iniziale; il prerender WebP della stessa scultura è visibile da subito. `?render3d=1` forza l’inizializzazione per screenshot e revisione, senza alterare il comportamento normale.

La qualità riduce segmenti, antialiasing e DPR sui dispositivi piccoli o con pochi core; il DPR è limitato a 1.65 su desktop e 1.25 in modalità ridotta. ResizeObserver aggiorna il canvas. IntersectionObserver sospende l’animazione fuori dalla hero; la visibilità della pagina interrompe il RAF. La perdita del contesto ripristina l’immagine. `pagehide` rilascia geometrie, materiali, environment map, renderer e observer; il ritorno dalla bfcache reinizializza la scena.

I reveal hanno una leggera prospettiva; le card usano CSS 3D e pointer events solo su puntatore preciso. Non è necessario usare il mouse. Lo scroll resta nativo.

Per disattivare le animazioni: pulsante pausa nella navbar, preferenza di sistema **Riduci movimento**, oppure `design.motion: false` nel JSON e rigenerazione. La preferenza di sistema prevale. Con movimento ridotto, JavaScript disabilitato, risparmio dati o WebGL non disponibile, la scultura statica rimane visibile; i contenuti restano leggibili.

## Struttura e strumenti

```text
content/site.json           Testi, SEO e impostazione movimento
scripts/template.mjs       Composizione HTML specifica Dark
scripts/html.mjs           Componenti semantici e metadati
scripts/update.mjs         Genera HTML, 404, sitemap, robots e favicon
assets/style.css           Design Dark, responsive, focus e stampa
assets/main.js             Navigazione, scroll, pausa, reveal e card
assets/theme.js            Preferenza movimento prima del CSS
src/scene.js               Sorgente Three.js del concept
scripts/build-scene.mjs    Bundle statico esbuild e hash di sincronizzazione
assets/scene.bundle.js     Bundle locale, caricato al primo scroll
assets/sculpture.webp      Fallback ottimizzato da 47 KB circa
assets/sculpture.png       Prerender sorgente della scultura
scripts/create-assets.mjs  Rigenera fallback, social card e icone
tests/site.spec.mjs        Test funzionali, 3D e WCAG automatico
scripts/capture.mjs        Screenshot desktop e mobile
scripts/audit.mjs          Lighthouse desktop e mobile
```

Nessun framework o backend. **esbuild** compila soltanto il bundle durante lo sviluppo; GitHub Pages serve i file già generati. Playwright, axe e Lighthouse sono strumenti di QA e non vengono inviati al visitatore. Nessun CDN, analytics, cookie o API key. La CSP mantiene `script-src 'self'` e l’hash JSON-LD, senza `unsafe-inline` o `unsafe-eval`. Gli stili aggiornati da JavaScript usano proprietà CSSOM, non stringhe HTML da dati personali.

## Comandi di sviluppo e screenshot

Su Windows usa `npm.cmd` se PowerShell blocca `npm.ps1`, senza cambiare le policy del computer.

```powershell
npm.cmd ci
npm.cmd run build:scene
npm.cmd run update
npm.cmd run check
npm.cmd test
```

Per rigenerare asset e fare screenshot, lascia il server avviato in un altro terminale:

```powershell
npm.cmd run assets
npm.cmd run screenshots
npm.cmd run audit
```

Le immagini e i report di revisione sono in `artifacts/`, ignorata da Git: `desktop.png`, `mobile.png`, versioni a pagina intera, report Lighthouse HTML/JSON. Edge installato è il browser di default; con Chrome imposta `$env:BROWSER_CHANNEL = 'chrome'`. Lighthouse usa `CHROME_PATH` quando fornito. Il comando `assets` richiede WebGL per catturare la scultura effettiva; non genera una sostituzione generica.

## Verifiche registrate

18 test Playwright superati su Edge/Chromium desktop e smartphone: risorse/console, rotazione reale sullo scroll, stabilizzazione, pausa e persistenza, movimento ridotto senza download WebGL, menu/focus, sezione attiva, 320/375/768/1440/1920 px, assenza di JS/WebGL, perdita del contesto, 404 e SEO. Axe non rileva violazioni nei controlli WCAG 2.2 AA applicati, inclusa la navigazione mobile aperta. Non è una certificazione manuale di conformità.

Lighthouse locale: **100 performance, 100 accessibilità, 100 best practices, 100 SEO**, sia desktop sia mobile. LCP circa 1.5 s, CLS 0; TBT 0 ms desktop e 40 ms mobile. È una singola misurazione di laboratorio del caricamento iniziale in questo ambiente, non una garanzia di Core Web Vitals reali né una misura INP sul campo. Il test separato di scroll verifica il percorso WebGL dopo l’interazione.

## Pubblicazione degli aggiornamenti

GitHub Pages serve `main`, cartella `/(root)`, sul dominio **https://gabrielepellerito.com/**. Il push sui branch di design non cambia il sito ufficiale. Non occorre un nuovo workflow, un nuovo hosting o una fase di build su GitHub.

Per aggiornare i contenuti della versione ufficiale, lavora su `main` nel checkout `sito-pronto`:

```powershell
node scripts/update.mjs
node scripts/check.mjs
git add .
git commit -m "Aggiorna sito personale"
git push
```

Mantieni il CNAME esistente e il backup. Dopo la distribuzione, verifica il sito pubblico. Eventuali cambi di design dai branch vanno revisionati prima di integrarli in `main`.
