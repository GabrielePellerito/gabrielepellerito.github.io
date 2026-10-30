# Gabriele Pellerito — Dark Editorial 3D

Braccio robotico artigianale · vaschetta aperta e fissaggio alla piastra · 30 ottobre 2026.

Nero profondo, nome monumentale e cognome a contorno. Robot in grafite e antracite, metallo satinato, dettagli argentati e luce di bordo più marcata.

## Tre anteprime indipendenti

Il sito pubblico è servito da `main`, che contiene la versione precedente del robot. La correzione della pala appartiene esclusivamente a `design/dark-editorial-3d`. Da questa revisione Dark è l'unico branch di sviluppo del modello, salvo nuova indicazione esplicita del proprietario. Light, Main e backup restano invariati; nessun merge, deploy, DNS o CNAME viene modificato.

| Versione | Worktree locale | Branch | URL |
| --- | --- | --- | --- |
| Main di confronto | `sito-pronto` | `main` | http://127.0.0.1:4173 |
| Dark | `concepts/dark-editorial-3d` | `design/dark-editorial-3d` | http://127.0.0.1:4174 |
| Light | `concepts/light-minimal-3d` | `design/light-minimal-3d` | http://127.0.0.1:4175 |

Le tre cartelle appartengono allo stesso repository Git tramite worktree. Non cambiare branch sotto un server attivo: confronta le versioni aprendo i tre URL in schede differenti. Nessuna dipendenza deve essere installata per navigare: i file statici sono già compilati.

Dal checkout di uno dei due design, in PowerShell:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/preview-worktrees.ps1 -Action Start
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/preview-worktrees.ps1 -Action Status
```

Il parametro ExecutionPolicy riguarda soltanto il processo che esegue questo script locale; non cambia la policy del computer. Lo script avvia tre processi Node nascosti, verifica branch e HTML restituito, riutilizza i server riconosciuti e rifiuta di arrestare processi sconosciuti. Le anteprime restano attive. Log in `artifacts/robot-previews/` nella cartella esterna del workspace.

Per interrompere i tre server:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/preview-worktrees.ps1 -Action Stop
```

Per riavviarli esegui Stop, poi Start. In una struttura diversa passa `-Workspace 'C:/percorso/sito-gabriele'`; le tre cartelle devono avere i nomi della tabella. Non vengono creati worktree aggiuntivi o modificati branch.

In alternativa, usa tre terminali PowerShell distinti dalla cartella esterna `sito-gabriele`:

```powershell
# Terminale 1
cd sito-pronto
$env:PORT = '4173'
node scripts/serve.mjs

# Terminale 2
cd concepts/dark-editorial-3d
$env:PORT = '4174'
node scripts/serve.mjs

# Terminale 3
cd concepts/light-minimal-3d
$env:PORT = '4175'
node scripts/serve.mjs
```

In ciascun terminale, Ctrl+C interrompe soltanto quel server. Se una porta è già occupata dal launcher, arresta prima i suoi processi. Il server ascolta esclusivamente su 127.0.0.1.

## Ricostruzione del prototipo

Le fotografie locali `IMG_0259.JPG` e `IMG_0261.JPG` definiscono basamento, struttura principale e posizione dei motori. Per la sola vaschetta e il suo fissaggio prevale il riferimento definitivo fornito dal proprietario, `Braccio meccanico con vaschetta rialzata.png` (nome alternativo: `braccio_meccanico_con_vaschetta_rialzata.png`). I colori esplicativi di quell'immagine non sono riprodotti nel sito. Nessuna quota dei riferimenti generati è considerata una misura reale. Il modello mantiene scatola rettangolare, basamento a strati, tavola lunga inclinata e due servo; non contiene una pinza o attuatori idraulici aggiunti.

`src/robot.js` costruisce vera geometria Three.js: tavole smussate, strati, corpi dei motori, alberi, squadrette estruse, viti, una pala a guscio chiuso e cavi tubolari. La correzione terminale è presente solo in questo branch; il codice Light conserva la versione precedente. Nessuna fotografia viene usata come texture o Hero.

Gerarchia dei tre gradi di libertà:

```text
RobotRoot
├── StationaryBase / StepperMotor
└── BaseRotationPivot                  asse Y
    └── RotatingStructure / ArmServomotor
        └── ArmServoPivot              asse Z locale
            └── ArmAssembly / ShovelServomotor
                └── ShovelServoPivot  asse Z locale
                    └── MountingPlate (solidale all'albero)
                        ├── ServoDrivePlate / MountingPlateSurface
                        └── ShovelAssembly (solidale alla piastra)
                            ├── CurvedShovel
                            ├── RearAttachmentEdge
                            └── FreeFrontEdge
```

La scatola resta ferma. Il primo pivot ruota tutta la struttura sovrastante; il secondo inclina la tavola e il gruppo terminale; il terzo muove soltanto pala e staffe collegate all'uscita. Il modello non è animato ruotando RobotRoot.

**Approssimazioni dichiarate:** proporzioni normalizzate senza unità fisiche; spessori, numero esatto degli strati e dei fissaggi; collegamenti posteriori, distanziali e geometria degli alberi; alloggiamento dello stepper dentro la scatola, non osservabile direttamente nelle foto; percorso semplificato dei cavi e gioco dei collegamenti; curvatura della pala. Incollaggi e irregolarità manuali sono semplificati, mantenendo l'assemblaggio a tavole. Non sono stati dedotti microcontrollori, driver, firmware, carichi o prestazioni reali.

Sequenza di presentazione, con transizioni smoothstep e interpolazione dello scroll esistente:

| Progresso | Movimento principale |
| --- | --- |
| 0% | Base neutra, tavola inclinata, pala quasi orizzontale |
| 0–25% | Rotazione della base |
| 25–55% | Inclinazione del braccio |
| 50–78% | Movimento indipendente della pala |
| 82–100% | Piccolo assestamento dei tre giunti nella posa finale |

Intervalli **solo visivi**, non limiti misurati: base 0°…48°, braccio −14°…1°, pala −16°…14°. Movimento deterministico e reversibile; nessun controllo del robot fisico.

### Vaschetta e fissaggio secondo il riferimento definitivo

La precedente interpretazione con guscio convesso frontale e apertura posteriore è superata. Il riferimento definitivo richiede una vaschetta aperta verso l'alto, estesa verso sinistra, con il bordo destro fissato direttamente alla superficie della piastra terminale. La correzione sostituisce sia la superficie sia il montaggio: non è una rotazione del vecchio guscio.

| Elemento | Relazione nel riferimento locale del servo terminale |
| --- | --- |
| Asse longitudinale A | Dal punto medio del bordo fissato a quello del bordo libero: −X |
| Asse del servo B | Asse del cilindro dell'albero trasformato nelle coordinate mondiali: Z locale |
| Relazione | A e B perpendicolari; il servo modifica l'inclinazione, non il rollio longitudinale |
| Superficie interna | Fondo sotto i bordi laterali; apertura +Y nella posa neutra |
| Fissaggio | Faccia destra della flangia posteriore a contatto con la faccia sinistra della piastra |
| Movimento | Piastra e vaschetta ruotano insieme sullo stesso pivot |

La piastra piegata collega il mozzo del servo alla superficie di fissaggio in YZ. La sua faccia a `x = −0.255` coincide con la faccia destra della flangia della vaschetta lungo tutta l'area di contatto. Due fissaggi attraversano questa interfaccia lungo X; l'albero del servo resta su Z. Il guscio ha fondo ribassato, bordi laterali rialzati, angoli arrotondati all'estremità libera e spessore finito. Tutte le dimensioni sono proporzioni normalizzate, non specifiche misurate dell'hardware; spessori della piastra, distanziale e fissaggi nascosti sono approssimati.

Pivot, segno delle rotazioni, intervalli angolari, motori, basamento e braccio principale sono invariati. Anche materiali, luci, layout, contenuti e API restano invariati. L'altezza della camera della Hero è stata portata da 2.9 a 5.7 nelle coordinate della scena per mostrare l'interno della vaschetta nella posa neutra. Nessun nuovo effetto o controllo è introdotto nella pagina.

Per ripetere la revisione dalla cartella Dark con il server 4174 attivo:

```powershell
node scripts/shovel-review.mjs
```

Lo script salva in `artifacts/shovel-correction/`: `shovel-right-orthographic.png`, `shovel-rear-orthographic.png`, `shovel-top-orthographic.png`, `shovel-attachment-closeup.png`, `shovel-neutral.png`, `shovel-tilted.png`, più la vista sinistra e le Hero desktop/mobile. Le tre viste ortogonali usano realmente `OrthographicCamera`, allineata agli assi mondiali: destra da +X, posteriore da −Z, superiore da +Y. A e B possono apparire puntiformi nelle viste lungo il rispettivo asse.

Le viste tecniche evidenziano A in ciano, B in ambra, pivot in magenta e superficie di contatto in verde, riportando prodotto scalare e distacco misurati. Gli indicatori e le camere tecniche sono aggiunti soltanto alla risposta intercettata da Playwright e non sono presenti nel bundle pubblico. Ogni screenshot richiede un contesto WebGL attivo; `verification.json` registra proiezione, direzione camera, assi, contatto ed errori. Screenshot e immagini di riferimento sono esclusi da Git. Il vecchio `robot-fix-review.mjs` resta disponibile per le inquadrature della revisione precedente.

## Rendering e prestazioni

`src/scene.js` conserva `createScene(mount, options)`, `setProgress(progress)` e `dispose()`. Il getter di sola lettura `diagnostics` serve ai test; non installa comandi, slider o globali nella pagina pubblica.

Three.js 0.186.1, esbuild e licenza MIT già presenti. Camera prospettica, materiali PBR, environment PMREM generata in memoria, luci neutre e ombre PCF. Nessun modello GLB, HDR, texture pesante, CDN o libreria aggiuntiva. Le due palette usano la stessa cinematica e le stesse geometrie.

`assets/main.js` è preservato: progressione normalizzata, requestAnimationFrame interpolato, IntersectionObserver, scroll nativo, menu accessibile e pausa persistente. Il bundle è caricato al primo scroll; il fallback WebP, generato dallo stesso modello, appare subito. `?render3d=1` forza il caricamento per revisione. Senza JavaScript, WebGL, con risparmio dati o movimento ridotto rimane l'immagine statica.

DPR massimo 1.65 desktop e 1.25 mobile; meno segmenti e ombre a risoluzione ridotta sui dispositivi piccoli. Circa 35.8 mila triangoli desktop e 14.1 mila mobile. Nessun render a riposo o fuori dalla Hero; resize e visibilità sono gestiti. In caso di perdita reale del contesto appare il fallback; al ripristino viene rigenerata anche la environment PMREM. `dispose()` rilascia risorse, observer e renderer e termina il contesto WebGL.

Per disabilitare il movimento: pulsante nella navbar, preferenza di sistema **Riduci movimento**, oppure `design.motion: false` nel JSON seguito da rigenerazione. La preferenza di sistema prevale.

Riferimenti tecnici: [gerarchia Object3D](https://threejs.org/docs/pages/Object3D.html) e [rilascio delle risorse Three.js](https://threejs.org/manual/pages/how-to-dispose-of-objects.html).

## Contenuti, SEO e privacy

Modifica **`content/site.json`**, poi `node scripts/update.mjs`. Non modificare soltanto l'HTML generato. I dati dei due branch, escluso `design`, sono uguali.

Il portfolio distingue il contributo professionale al sito coworking da **Braccio robotico articolato**, progetto personale confermato dal proprietario. Per il robot sono elencati soltanto stepper, due servo, struttura artigianale, elettronica e cablaggio. La scheda usa il prerender del modello, identificato come ricostruzione; nessuna demo, repository, data o stack non documentati.

Il profilo professionale deriva dal CV del 14 aprile 2025. Sono preservati quattro incarichi/tirocini, qualifica di Operatore informatico, mobilità internazionale e sette categorie di competenze. I percorsi Galdus di Tecnico informatico e robotica ABB riportano **Stato da aggiornare**: non sono dichiarati ancora attivi nel 2026 o conclusi. Lingue dichiarate: italiano madrelingua, inglese C1, spagnolo B1, francese A2. Nessuna certificazione aggiunta.

Email e social rimangono vuoti, senza telefono, indirizzo privato o data di nascita. Un futuro indirizzo autorizzato in `contact.email` genera un vero mailto; nessun form simulato.

Il CV, le fotografie e l'infografica sono esclusi tramite `.gitignore` e non sono copiati nei file pubblicabili. Entrambi i worktree consultano le fonti in posizione locale, senza necessità di duplicarle. Le copie preesistenti in Main sono protette anche dall'esclusione Git locale condivisa, senza modificare alcun file di Main. Il server dei concept rifiuta richieste alle fonti, comprese varianti maiuscole e URL codificati. I controlli impediscono che siano tracciate.

Canonico invariato: https://gabrielepellerito.com/. HTML semantico, ProfilePage/Person, Open Graph, Twitter card e testi alternativi pertinenti; sitemap e robots restano sincronizzati. Nessun tracker, cookie, backend o credenziale. CSP senza unsafe-inline/unsafe-eval.

## File principali

| File | Funzione |
| --- | --- |
| `content/site.json` | Contenuti pubblici e impostazioni |
| `src/robot.js` | Geometria, materiali, pivot e sequenza articolata |
| `src/scene.js` | Camera, illuminazione, rendering e ciclo di vita |
| `assets/main.js` | Navigazione e movimento esistenti |
| `assets/style.css` | Stile del concept e anteprima progetto senza ritagli |
| `scripts/template.mjs`, `scripts/html.mjs` | Layout e componenti semantici |
| `scripts/build-scene.mjs` | Bundle e hash di scene.js, robot.js e bundle |
| `scripts/create-assets.mjs` | Fallback PNG/WebP, social card e icone |
| `scripts/privacy.mjs` | Protezione delle fonti private |
| `scripts/preview-worktrees.ps1` | Start, Status e Stop delle tre anteprime |
| `scripts/robot-previews.mjs` | Screenshot delle tre pose e confronto Main |
| `scripts/robot-harness.mjs` | Controllo della posa nel solo browser di test |
| `scripts/robot-fix-review.mjs` | Tre pose Dark, dettaglio, profilo, apertura e vista superiore |
| `scripts/shovel-review.mjs` | Revisione attuale: viste ortogonali e fissaggio della vaschetta |
| `tests/shovel-mechanics.mjs`, `tests/shovel-debug.mjs` | Misure geometriche e indicatori esclusivamente per QA |
| `scripts/robot-profile.mjs` | Campione locale di frame e rilascio risorse |
| `tests/robot-model.test.mjs`, `tests/robot.spec.mjs` | Cinematica e WebGL reale |

## Build, test e screenshot

Node.js 22 o successivo. Usa `npm.cmd` se PowerShell blocca npm.ps1; non occorre cambiare policy.

```powershell
npm.cmd ci
npm.cmd run build:scene
npm.cmd run update
# Con il rispettivo server locale gia avviato:
npm.cmd run assets
npm.cmd run check
npm.cmd run test:robot
npm.cmd test -- --workers=2
node scripts/check-cv.mjs --compare ../OTHER-DESIGN
node scripts/robot-profile.mjs
npm.cmd run audit
```

Sostituisci OTHER-DESIGN con `light-minimal-3d` da Dark, o `dark-editorial-3d` da Light. Il riesame CV legge soltanto la fonte privata locale; se si trova altrove, imposta CV_SOURCE. Non serve per il normale build di un clone pubblico.

Per aggiornare il modello: modifica le sorgenti, ricompila il bundle, rigenera asset e controlla la sincronizzazione. `node scripts/create-assets.mjs --social-only` aggiorna soltanto social card e icone quando cambia il testo.

```powershell
# Tre pose desktop e una mobile del branch corrente:
npm.cmd run screenshots:robot

# Tutte le versioni, con i tre server attivi:
$env:PREVIEW_ARTIFACTS = (Join-Path (Resolve-Path ../..) 'artifacts/robot-previews')
node scripts/robot-previews.mjs --all
Remove-Item Env:PREVIEW_ARTIFACTS
```

File: `hero-main.png`, `hero-dark-0.png`, `hero-dark-50.png`, `hero-dark-100.png`, `hero-light-0.png`, `hero-light-50.png`, `hero-light-100.png`, più `hero-dark-mobile.png` e `hero-light-mobile.png`. `verification.json` registra WebGL attivo, pose, identità ed errori.

L'harness modifica soltanto la risposta JavaScript nel contesto Playwright per controllare la scena già avviata, lasciando la vera interfaccia. Imposta 0, 0.5 e 1 mantenendo la Hero inquadrata; verifica canvas, contesto e scomparsa del fallback prima dello screenshot. Nessun comando di debug è pubblicato nell'interfaccia.

Edge/Chromium installato è il browser predefinito; `BROWSER_CHANNEL=chrome` seleziona Chrome. `artifacts/` è esclusa da Git. Report Lighthouse HTML/JSON e campione `robot-performance.json` sono locali.

## Verifiche

La suite Dark comprende **36 test Playwright e 6 test Node**. Copre contenuti/SEO, errori HTTP e JavaScript, navigazione/focus/menu, 320/375/768/1440/1920 px, no-JS/no-WebGL, movimento ridotto, pausa, scroll reale anche con inversioni rapide, tre giunti, reversibilità, semplificazione mobile, stabilizzazione, perdita/ripristino reale del contesto e distruzione del renderer. I controlli geometrici misurano A e B nel medesimo sistema mondiale, verificano contatto e contenimento dell'intera faccia posteriore sulla piastra lungo 201 pose, gerarchia solidale, apertura neutra verso l'alto, fondo concavo, bordi rialzati, arrotondamento e separazione da tavola e motore. La tolleranza numerica per ortogonalità e distacco è 1e−7. Il test delle palette riguarda le opzioni del modulo locale, non l'equivalenza con il branch Light.

Axe applica i controlli WCAG 2.2 AA alla pagina e al menu mobile; non sostituisce una certificazione manuale. I controlli geometrici verificano gerarchia e distanze dalla base lungo 201 pose: non sono una simulazione della dinamica, dei carichi o una verifica CAD completa delle collisioni.

Lighthouse misura il caricamento iniziale; `robot-profile.mjs` controlla separatamente il percorso WebGL dopo l'interazione. Emulazione mobile sul computer, non prova su smartphone fisico o misura INP sul campo.

Misurazione locale finale del 28 ottobre 2026: Lighthouse **100 performance, 100 accessibilità, 100 best practices, 100 SEO**, su desktop e mobile. LCP desktop/mobile: 1.5 s / 1.4 s; CLS 0 su entrambi; TBT desktop/mobile: 0 ms / 0 ms. Il campione WebGL non produce frame a riposo; dopo dispose il canvas è rimosso, le geometrie rilasciate e il contesto terminato. Sono risultati di laboratorio, non garanzie su dispositivi reali.

## Git e pubblicazione futura

Per questo intervento e per i successivi miglioramenti del modello, salvo autorizzazione esplicita diversa, il solo branch modificabile è `design/dark-editorial-3d`. Eseguire push esclusivamente su `origin/design/dark-editorial-3d`. Main, Light e backup originale restano invariati. Non effettuare merge o pubblicazioni automatiche. I server locali non vengono arrestati dopo i test o il push.

Per confrontare il codice usa i worktree esistenti, oppure `git diff main...design/dark-editorial-3d`. In un clone senza worktree usa `git switch` soltanto dopo aver salvato le modifiche e fermato il relativo server.

Per pubblicare uno dei modelli in futuro, prima revisiona una pull request verso Main. Occorre una decisione esplicita del proprietario; non serve cambiare dominio o hosting.
