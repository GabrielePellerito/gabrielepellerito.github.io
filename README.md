# Gabriele Pellerito — Light Minimal 3D

Concept autonomo sul branch `design/light-minimal-3d`. Nasce dal commit **447a6a8** di `origin/main`, come `design/dark-editorial-3d`. Non è pubblicato sul sito ufficiale. Il branch `main`, il backup `backup/versione-originale-2026-10-27`, il file `CNAME` e la configurazione di Pages non sono stati modificati da questo lavoro.

## Direzione visiva

Bianco neutro, nero e grigi argentati. Nome su una riga ampia con contrasto fra sans serif e corsivo editoriale. Scultura architettonica sospesa, timeline a griglia orizzontale, progetti su righe alternate e firma tipografica a tutta larghezza nel footer. Struttura, geometria e ritmo visivo sono differenti dal Dark: non si tratta di un cambio palette.

## Avvio locale

Da questa cartella, con Node.js 22 o successivo:

```powershell
node scripts/serve.mjs
```

Apri **http://127.0.0.1:4175**. Non occorre installare dipendenze per l’anteprima: HTML, immagini e bundle WebGL sono già inclusi. Ferma il server con `Ctrl+C`. Per una porta diversa: `$env:PORT = '4180'` prima del comando.

I due checkout locali sono `concepts/dark-editorial-3d` e `concepts/light-minimal-3d`, ciascuno sul proprio branch. Il checkout precedente `sito-pronto` rimane sul suo `main` locale.

Per lavorare da un clone nuovo:

```powershell
git clone https://github.com/GabrielePellerito/gabrielepellerito.github.io.git portfolio-concepts
cd portfolio-concepts
git switch design/light-minimal-3d
node scripts/serve.mjs
```

Per cambiare concept in un clone ordinario, arresta il server, salva le modifiche, poi `git switch design/dark-editorial-3d` e riavvia. Con i worktree già presenti Git impedisce di aprire lo stesso branch in due directory: usa direttamente il checkout corrispondente.

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

**Three.js 0.186.1**, con licenza MIT inclusa, serve per geometria e materiali realmente tridimensionali. `src/scene.js` costruisce due portali quadrati con fori e bordi smussati usando `Shape`, `Path` ed `ExtrudeGeometry`. Un icosaedro scuro sfaccettato occupa un diverso piano di profondita. Le superfici frontali sono in cromo e porcellana; bordi e fianchi mostrano lo spessore effettivo. Camera prospettica, luci neutre, materiali PBR `MeshStandardMaterial`, riflessi generati da `RoomEnvironment` e `PMREMGenerator` senza file HDR o servizi esterni. I portali cambiano orientamento anche fra loro, mentre il nucleo si muove lungo Z: il movimento non e una rotazione di un'immagine piatta.

`assets/main.js` normalizza lo scroll della hero in `[0, 1]` e interpola la posizione con `requestAnimationFrame`. Cambiano rotazioni X/Y/Z, posizione, scala e camera. Non c’è auto-rotazione: a posizione stabilizzata il ciclo si ferma. WebGL è caricato **al primo scroll**, per non ritardare il contenuto iniziale; il prerender WebP della stessa scultura è visibile da subito. `?render3d=1` forza l’inizializzazione per screenshot e revisione, senza alterare il comportamento normale.

La geometria riduce curve e smussature sui dispositivi piccoli o con pochi core; il DPR e limitato a 1.65 su desktop e 1.25 in modalita ridotta. L'antialiasing rimane attivo per i bordi architettonici. ResizeObserver aggiorna il canvas. IntersectionObserver sospende l’animazione fuori dalla hero; la visibilità della pagina interrompe il RAF. La perdita del contesto ripristina l’immagine. `pagehide` rilascia geometrie, materiali, environment map, renderer e observer; il ritorno dalla bfcache reinizializza la scena.

I reveal hanno una leggera prospettiva; le card usano CSS 3D e pointer events solo su puntatore preciso. Non è necessario usare il mouse. Lo scroll resta nativo.

Per disattivare le animazioni: pulsante pausa nella navbar, preferenza di sistema **Riduci movimento**, oppure `design.motion: false` nel JSON e rigenerazione. La preferenza di sistema prevale. Con movimento ridotto, JavaScript disabilitato, risparmio dati o WebGL non disponibile, la scultura statica rimane visibile; i contenuti restano leggibili.

## Struttura e strumenti

```text
content/site.json           Testi, SEO e impostazione movimento
scripts/template.mjs       Composizione HTML specifica Light
scripts/html.mjs           Componenti semantici e metadati
scripts/update.mjs         Genera HTML, 404, sitemap, robots e favicon
assets/style.css           Design Light, responsive, focus e stampa
assets/main.js             Navigazione, scroll, pausa, reveal e card
assets/theme.js            Preferenza movimento prima del CSS
src/scene.js               Sorgente Three.js del concept
scripts/build-scene.mjs    Bundle statico esbuild e hash di sincronizzazione
assets/scene.bundle.js     Bundle locale, caricato al primo scroll
assets/sculpture.webp      Fallback ottimizzato da 24 KB circa
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

Lighthouse locale: **100 performance, 100 accessibilità, 100 best practices, 100 SEO**, sia desktop sia mobile. LCP circa 1.4 s, CLS 0; TBT 0 ms desktop e 70 ms mobile. È una singola misurazione di laboratorio del caricamento iniziale in questo ambiente, non una garanzia di Core Web Vitals reali né una misura INP sul campo. Il test separato di scroll verifica il percorso WebGL dopo l’interazione.

## Pubblicazione futura

Il push su questo branch **non pubblica il design**: Pages continua a servire `main`. Gli URL canonici dei concept sono già `https://gabrielepellerito.com/`; questo non modifica DNS, CNAME o impostazioni di hosting. Nessun workflow di deploy viene aggiunto.

Se in futuro scegli questo design, revisiona il diff in una pull request verso `main`, aggiorna prima i contenuti personali e verifica il dominio. Solo dopo una tua decisione esplicita, il merge su `main` attiverà la pubblicazione configurata. Mantieni il CNAME esistente e il backup. Non occorre un nuovo hosting o una fase di build su GitHub.
