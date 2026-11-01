# Gabriele Pellerito — Dark Editorial 3D

Braccio robotico artigianale · scavo, voragine e luce controllati dallo scroll · 1 novembre 2026.

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
            └── ArmAssembly / ShovelServomotor (montaggio originale)
                └── ShovelServoPivot (Z originale del servo)
                    ├── ServoDrivePlate / TerminalPlateBridge
                    └── MountingPlate (orientamento della pala conservato)
                        ├── MountingPlateSurface
                        └── ShovelAssembly (solidale alla piastra)
                            ├── CurvedShovel
                            ├── RearAttachmentEdge
                            └── FreeFrontEdge
```

La scatola resta ferma. Il primo pivot ruota tutta la struttura sovrastante; il secondo inclina la tavola e il gruppo terminale; il terzo muove soltanto pala e staffe collegate all'uscita. Il modello non è animato ruotando RobotRoot.

**Approssimazioni dichiarate:** proporzioni normalizzate senza unità fisiche; spessori, numero esatto degli strati e dei fissaggi; collegamenti posteriori, distanziali e geometria degli alberi; alloggiamento dello stepper dentro la scatola, non osservabile direttamente nelle foto; percorso semplificato dei cavi e gioco dei collegamenti; curvatura della pala. Incollaggi e irregolarità manuali sono semplificati, mantenendo l'assemblaggio a tavole. Non sono stati dedotti microcontrollori, driver, firmware, carichi o prestazioni reali.

Sequenza cinematografica, con timeline deterministica e scroll nativo interpolato:

| Progresso | Movimento principale |
| --- | --- |
| 0–15% | Presentazione del modello approvato, terreno integro |
| 15–35% | I tre giunti portano il bordo di taglio alla superficie |
| 35–55% | Penetrazione e raschiamento, detriti e prima cavità |
| 55–72% | Ritrazione della pala, apertura della voragine e crepe |
| 72–88% | Luce interna, raggi e particelle bianche |
| 88–100% | Camera dentro l'apertura, dissolvenza e comparsa del vero contenuto Chi sono |

Intervalli cinematografici **solo visivi**, non limiti misurati: base 0°…10°, braccio −91°…−14°, pala −25°…16°. Sono tre rotazioni locali: la base del modello rimane ferma. `poseForProgress()` conserva le pose della precedente revisione per ispezioni meccaniche; la scena utilizza ora `timeline()` e `robot.setPose()` con la stessa gerarchia, senza cambiare il fissaggio approvato.

### Architettura dello scrollytelling

La Hero riserva circa **480svh su desktop e 340svh su mobile**, con un contenitore sticky alto quanto il viewport disponibile sotto la navbar. La composizione iniziale è predisposta prima del caricamento del 3D; lo spazio narrativo esteso viene attivato soltanto dopo la creazione riuscita della scena. Nessun blocco della rotellina, del touch o dello scroll del documento.

| File | Responsabilità |
| --- | --- |
| `src/timeline.js` | Pose e sei fasi ricostruite da un unico progresso 0–1 |
| `src/robot.js` | Geometria approvata e tre pivot; API aggiuntiva `setPose()` |
| `src/digging.js` | Misura dei vertici reali della punta curva e del rinforzo frontale |
| `src/terrain.js` | Superficie procedurale, pareti interne profonde, crepe e banco rialzato |
| `src/atmosphere.js` | Detriti instanziati, raggi GLSL, particelle e luce puntiforme |
| `src/cinematic-camera.js` | Inquadrature e attraversamento tridimensionale della cavità |
| `src/scene.js` | Renderer, risorse, contesto WebGL e orchestrazione |
| `assets/main.js`, `assets/style.css` | Scroll nativo, sticky, pausa, salto e transizione HTML |

Il prototipo non viene allungato per raggiungere un pavimento arbitrario: il **banco rialzato è posizionato dalla geometria della punta alla posa di contatto del 35%**. Il banco è poco profondo nella direzione del braccio, lasciando servo e supporto fuori dalla faccia posteriore. La pala penetra durante la fase centrale e viene sollevata prima dell'apertura completa. Le pareti della cavità hanno profondità reale; il foro non è una decalcomania circolare.

Detriti e particelle dipendono esclusivamente dal progresso e da semi fissi. Tornando indietro si ricostruiscono le stesse matrici, le crepe si ritirano e la superficie si richiude. Il terreno viene aggiornato solo quando varia l'apertura. I raggi sono volumi trasparenti simulati con shader additivi: non viene eseguito un costoso ray marching o un bloom a schermo intero. La luce puntiforme cambia i riflessi del robot; le ombre PCF seguono le articolazioni.

La camera entra sotto il piano del terreno nell'ultima fase. Una luce graduale e la dissolvenza del canvas accompagnano l'ingresso della **sezione HTML originale `#chi-sono`**. Non vengono duplicati i contenuti del CV. Navbar, link “Salta l'introduzione”, anchor diretti e pausa permettono di raggiungere subito le informazioni. Senza WebGL, JavaScript, con risparmio dati o movimento ridotto non viene riservata la lunga sequenza.

Questa è una visualizzazione narrativa, non una simulazione dinamica di terreni o carichi del servo: traiettorie dei detriti, terreno e raggi sono procedurali. Gli angoli non costituiscono specifiche del prototipo fisico.

### Vaschetta e fissaggio secondo il riferimento definitivo

Il riferimento definisce la forma della vaschetta aperta e il fissaggio alla piastra. La correzione richiesta dal proprietario **conserva l'orientamento della pala** (ruotata di +90° sulla verticale) e **l'orientamento originale del servo**, spostando il fissaggio sul bordo laterale opposto. Il vincolo è la perpendicolarità fra il **bordo corto** e l'albero del servo; non fra asse longitudinale e albero.

| Elemento | Relazione nel riferimento locale del servo terminale |
| --- | --- |
| Asse longitudinale A | −X nel riferimento della piastra; dopo la rotazione verticale punta verso +Z mondiale nella posa neutra |
| Asse del servo B | Z nel riferimento del braccio, ripristinato come prima; +Z mondiale nella posa neutra |
| Bordo corto C | +X mondiale nella posa neutra, perpendicolare a B |
| Relazione | C e B perpendicolari; A è parallelo a B. Durante lo scroll la pala segue l'asse originale del servo |
| Superficie interna | Fondo sotto i bordi laterali; apertura +Y nella posa neutra |
| Fissaggio | Intera flangia posteriore a contatto con la piastra; bordo corto coincidente con il bordo superiore del supporto e parallelo a X mondiale nella posa neutra |
| Movimento | Piastra e vaschetta ruotano insieme sullo stesso pivot |

Nel riferimento locale della piastra, la faccia a `x = −0.255` coincide con quella della flangia della vaschetta. Il bordo corto posteriore e il bordo superiore del supporto coincidono a `y = 0.18`; la pala è stata rialzata di 0.10 unità rispetto al montaggio precedente. Due fissaggi attraversano l'interfaccia lungo X locale. Il guscio conserva fondo ribassato, bordi rialzati, estremità arrotondata e spessore finito.

Motore, albero e cablaggio terminale conservano il montaggio originale. `MountingPlate` mantiene la rotazione verticale della pala e viene traslata di −0.94 lungo X nel riferimento dell'uscita: il centro della vaschetta passa dal lato +0.47 al lato −0.47 dell'albero. Pala e piastra non vengono ruotate né specchiate. Il raccordo rigido e il suo fissaggio laterale seguono il nuovo lato, mantenendo il collegamento all'uscita del servo.

Con gli stessi angoli, la corsa attiva del servo (progresso 0.50–0.78) porta la vaschetta dall'esterno verso il braccio. Il piccolo assestamento finale già presente rimane invariato; la posizione finale resta più interna di quella iniziale. Il test misura entrambi i bordi nel riferimento del braccio, escludendo il movimento della base e del primo servo, e verifica anche il ritorno alla posizione iniziale.

Il centro e l'asse del giunto terminale, gli intervalli angolari, il basamento, il braccio principale, la forma e l'orientamento della pala sono invariati rispetto alla revisione `31f928b`. Materiali, luci, layout, contenuti, camera e API restano invariati. Tutte le dimensioni sono proporzioni normalizzate; raccordo, distanziale e fissaggi nascosti sono approssimazioni, non specifiche misurate del prototipo.

Per ripetere la revisione dalla cartella Dark con il server 4174 attivo:

```powershell
node scripts/shovel-review.mjs

# Per conservare separatamente le viste del fissaggio sul bordo opposto:
$env:REVIEW_ARTIFACTS = Join-Path (Get-Location) 'artifacts/shovel-inward-mount'
node scripts/shovel-review.mjs
Remove-Item Env:REVIEW_ARTIFACTS
```

Lo script salva in `artifacts/shovel-correction/`: `shovel-right-orthographic.png`, `shovel-rear-orthographic.png`, `shovel-top-orthographic.png`, `shovel-attachment-closeup.png`, `shovel-neutral.png`, `shovel-tilted.png`, più la vista sinistra e le Hero desktop/mobile. Le tre viste ortogonali usano realmente `OrthographicCamera`, allineata agli assi mondiali: destra da +X, posteriore da −Z, superiore da +Y. A e B possono apparire puntiformi nelle viste lungo il rispettivo asse.

Le viste tecniche evidenziano A (lunghezza) in ciano, B (albero) in ambra, C (bordo corto) in viola, pivot in magenta e contatto in verde. Il prodotto scalare verificato è `dot(C,B)`, insieme al distacco dalla piastra. Gli indicatori e le camere tecniche sono aggiunti soltanto alla risposta intercettata da Playwright e non sono presenti nel bundle pubblico. Ogni screenshot richiede un contesto WebGL attivo; `verification.json` registra proiezione, direzione camera, assi, contatto ed errori. Screenshot e immagini di riferimento sono esclusi da Git. Il vecchio `robot-fix-review.mjs` resta disponibile per le inquadrature della revisione precedente.

## Rendering e prestazioni

`src/scene.js` conserva `createScene(mount, options)`, `setProgress(progress)` e `dispose()`. Il getter di sola lettura `diagnostics` serve ai test; non installa comandi, slider o globali nella pagina pubblica.

Three.js 0.186.1, esbuild e licenza MIT già presenti. Camera prospettica, materiali PBR, environment PMREM generata in memoria, luci neutre e ombre PCF. Nessun modello GLB, HDR, texture pesante, CDN o libreria aggiuntiva. La nuova sequenza appartiene soltanto a Dark; il branch Light è invariato.

`assets/main.js` mantiene menu, focus, microinterazioni e pausa persistente. Il controller misura la corsa della sezione sticky al resize e interpola il progresso con requestAnimationFrame. Il bundle è caricato al primo scroll; il fallback WebP appare subito, per evitare la compilazione WebGL nel percorso critico iniziale. `?render3d=1` forza il caricamento per revisione. Il generatore degli asset usa una scena isolata con inquadratura `poster`, evitando di catturare navbar o altri elementi HTML.

DPR massimo 1.65 desktop e 1.25 mobile; meno segmenti, particelle e ombre a risoluzione ridotta sui dispositivi piccoli. Le viste misurate restano sotto 45 mila triangoli desktop, 19 mila mobile e 250 draw call. Nessun render a riposo o fuori dalla Hero; resize e visibilità sono gestiti. In caso di perdita reale del contesto appare il fallback e lo spazio di scroll esteso viene rimosso; al ripristino viene rigenerata anche la environment PMREM. `dispose()` rilascia geometrie, materiali, risorse dei frammenti instanziati, observer e renderer e termina il contesto WebGL.

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
npm.cmd run screenshots:story
# Video locale della sequenza avanti e indietro:
node scripts/scrollytelling-review.mjs --video
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

La suite Dark comprende **42 test Playwright e 10 test Node**. Copre contenuti/SEO, errori HTTP e JavaScript, navigazione/focus/menu, 320/375/768/1440/1920 px, no-JS/no-WebGL, movimento ridotto, pausa, scroll reale anche con inversioni rapide, tre giunti, reversibilità, semplificazione mobile, stabilizzazione, perdita/ripristino reale del contesto e distruzione del renderer. I controlli geometrici misurano la perpendicolarità fra bordo corto C e albero B nello stesso sistema mondiale; verificano contatto e contenimento della faccia posteriore lungo 201 pose, coincidenza del bordo corto con quello superiore del supporto, orientamento neutro della pala conservato, asse originale del servo, raccordo solidale e separazione da tavola e motore. Un test dedicato verifica la corsa dall'esterno verso l'interno con il fissaggio sul bordo opposto. La tolleranza numerica per ortogonalità e distacco è 1e−7. Il test delle palette riguarda le opzioni del modulo locale, non l'equivalenza con il branch Light.

Axe applica i controlli WCAG 2.2 AA alla pagina e al menu mobile; non sostituisce una certificazione manuale. I controlli geometrici verificano gerarchia e distanze dalla base lungo 201 pose: non sono una simulazione della dinamica, dei carichi o una verifica CAD completa delle collisioni.

Lighthouse misura il caricamento iniziale; `robot-profile.mjs` controlla separatamente il percorso WebGL dopo l'interazione. Emulazione mobile sul computer, non prova su smartphone fisico o misura INP sul campo.

Misurazione Lighthouse del 31 ottobre 2026 dopo l'ottimizzazione del caricamento: **100 performance, 100 accessibilità, 100 best practices, 100 SEO**, su desktop e mobile. LCP 1.4 s, CLS 0 e TBT 0 ms su entrambi. Questi punteggi riguardano il caricamento iniziale con fallback; non misurano la fluidità della sequenza WebGL. Il profilo interattivo separato registra mediana 4.2 ms e p95 4.3 ms sul computer di sviluppo, zero frame a riposo e zero geometrie dopo dispose. Il contatore Three.js mantiene una texture interna, con renderer distrutto e contesto GPU terminato. Sono risultati di laboratorio, non garanzie su dispositivi reali.

La revisione locale è salvata in `artifacts/scrollytelling-review/`: sette screenshot desktop `scroll-00-hero.png`, `scroll-15-preparazione.png`, `scroll-35-contatto.png`, `scroll-50-scavo.png`, `scroll-70-voragine.png`, `scroll-85-aura.png`, `scroll-100-transizione.png`, quattro viste mobile, `verification.json` e `scrollytelling-desktop.webm`. Lo script muove lo scroll reale e verifica un contesto WebGL attivo; il video registra lo stesso browser. La cartella è esclusa da Git e dal server statico.

## Git e pubblicazione futura

Per questo intervento e per i successivi miglioramenti del modello, salvo autorizzazione esplicita diversa, il solo branch modificabile è `design/dark-editorial-3d`. Eseguire push soltanto su richiesta esplicita del proprietario; questo task autorizza il push del risultato sul solo branch Dark. Main, Light e backup originale restano invariati, incluse eventuali modifiche locali già presenti. Non effettuare merge o pubblicazioni automatiche. I server locali non vengono arrestati dopo i test o il push.

Per confrontare il codice usa i worktree esistenti, oppure `git diff main...design/dark-editorial-3d`. In un clone senza worktree usa `git switch` soltanto dopo aver salvato le modifiche e fermato il relativo server.

Per pubblicare uno dei modelli in futuro, prima revisiona una pull request verso Main. Occorre una decisione esplicita del proprietario; non serve cambiare dominio o hosting.
