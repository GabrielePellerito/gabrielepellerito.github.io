# Gabriele Pellerito · sito personale

Sito statico in italiano, con HTML semantico, CSS e JavaScript senza framework. Stile editoriale avorio e verde bosco, modalità chiara/scura, menu mobile, navigazione da tastiera e animazioni che rispettano `prefers-reduced-motion`.

Questa cartella **`sito-pronto` è il progetto definitivo e ha il proprio repository Git**. È separata dalla cartella superiore perché un altro processo vi stava modificando i file. Una copia di quei file è conservata in `../.workspace-backup/versione-preesistente.zip` e non fa parte di questo repository.

## Visualizzare il sito

Apri PowerShell in questa cartella:

```powershell
cd C:\Users\gabri\Desktop\sito-gabriele\sito-pronto
node scripts/serve.mjs
```

Visita **http://127.0.0.1:4173**. Interrompi il server con `Ctrl+C`. Il server usa solo l’interfaccia locale. Non richiede installazioni npm per visualizzare il sito.

Per un’anteprima sulla rete locale, se necessaria, puoi usare `python -m http.server 8001 --bind 0.0.0.0` e aprire dal telefono l’indirizzo IP del computer seguito da `:8001`, sulla stessa rete. Questo espone la cartella alla rete: avvialo soltanto quando ti serve e arrestalo alla fine.

## Modificare tutte le informazioni personali

Modifica **`content/site.json`**: contiene identità, testi, navigazione, metadati SEO, esperienze, formazione, competenze, interessi, progetti e contatti. Non modificare direttamente `index.html`: è generato a partire da questo file e verrebbe sovrascritto.

1. Sostituisci i testi che iniziano con `[Da completare]` e gli altri segnaposto con informazioni autentiche.
2. Imposta `"placeholder": false` nelle schede completate. Rimuovi le schede non necessarie o duplicane una per aggiungerne altre. Quando inserisci progetti reali, aggiorna anche l’introduzione che attualmente spiega la presenza dei segnaposto.
3. Inserisci l’email che vuoi rendere pubblica in `contact.email`; lasciala vuota per nasconderla. Non viene usato alcun backend: il pulsante apre il programma email del visitatore.
4. Aggiungi in `contact.socials` soltanto profili pubblici confermati. Esempio di formato (sostituisci l’URL):

   ```json
   { "label": "LinkedIn", "url": "https://www.linkedin.com/in/IL-TUO-PROFILO/" }
   ```

5. Per i progetti usa URL HTTPS effettivi nel campo `url`. Un segnaposto non genera un collegamento; un progetto con `placeholder: false` e URL valido mostra il pulsante.
6. Salva e aggiorna i file statici:

   ```powershell
   node scripts/update.mjs
   node scripts/check.mjs
   ```

7. Ricarica il browser. Non serve un processo di build su GitHub.

Il JSON usa doppi apici e non ammette commenti o virgole dopo l’ultimo elemento. Un errore di sintassi interrompe l’aggiornamento con un messaggio. Il controllo segnala anche HTML o sitemap non sincronizzati.

`seo.url` deve essere un URL HTTPS completo che termina con `/`. Aggiorna automaticamente canonical, Open Graph, JSON-LD, sitemap, robots e i collegamenti della pagina 404. `seo.indexing: false` disabilita l’indicizzazione tramite meta tag e robots: utile finché i contenuti sono incompleti, senza costituire una protezione d’accesso.

Per cambiare colori, spaziatura e tipografia modifica le variabili iniziali di `assets/style.css`. I font sono quelli del sistema e Georgia: non richiedono richieste a Google o licenze di redistribuzione. Monogramma e grafiche geometriche sono originali, realizzati in CSS/SVG. Non sono utilizzate foto di persone o immagini di terzi.

Se cambi nome o iniziali, dopo l’aggiornamento rigenera anche le immagini PNG:

```powershell
npm.cmd ci
npm.cmd run assets
```

Questo comando usa Microsoft Edge già installato. Su un altro computer puoi impostare `$env:BROWSER_CHANNEL = 'chrome'` se hai Chrome, oppure installare Edge. Il browser serve solo per esportare immagini e test, mai ai visitatori del sito.

## File del progetto

```text
content/site.json          Unica fonte dei contenuti e metadati
index.html                 Homepage statica generata, fruibile senza JavaScript
404.html                   Pagina di errore personalizzata
assets/style.css           Design, responsive, stampa e temi
assets/theme.js            Preferenza tema applicata prima del CSS
assets/main.js             Menu, tema, animazioni, copia email
assets/favicon.svg         Favicon vettoriale
assets/favicon-32.png      Favicon PNG di compatibilità
assets/apple-touch-icon.png Icona per dispositivi Apple
assets/social-card.png     Immagine Open Graph 1200 × 630
robots.txt                 Indicazioni ai crawler
sitemap.xml                Sitemap con URL canonico
.nojekyll                  Pubblicazione statica diretta con GitHub Pages
CNAME.example              Dominio preparato, non ancora attivato
scripts/                   Aggiornamento, verifica, anteprima e asset
tests/site.spec.mjs        Test funzionali e controlli automatici di accessibilità
playwright.config.mjs      Browser desktop e mobile per i test
package.json               Comandi di sviluppo; nessuna dipendenza runtime
package-lock.json          Versioni riproducibili degli strumenti di test
```

Non aggiungere dati sensibili, chiavi, token, numeri di telefono o indirizzi privati: il repository e i file pubblicati saranno accessibili a chiunque.

## Verifiche

Richiede Node.js 22 o successivo. In PowerShell usa `npm.cmd` per evitare il blocco di `npm.ps1` della policy di esecuzione del sistema, senza cambiare quella policy.

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd test
```

I test avviano il server locale quando necessario e usano Edge. Verificano HTTP, errori JavaScript e risorse, ancore, menu e tastiera, tema persistente, visualizzazione senza JavaScript, layout da 320 a 1920 pixel, pagina 404, SEO e regole automatiche WCAG 2.1 A/AA con axe nei due temi. I controlli automatici non equivalgono a una certificazione completa di accessibilità.

`node scripts/capture.mjs`, con il server già avviato, salva anteprime desktop, mobile e scura nella cartella ignorata `artifacts/` e riporta il peso delle risorse caricate. Non è un benchmark della rete pubblica.

## Stato GitHub e prima pubblicazione

Alla preparazione del progetto Git e Git Credential Manager erano disponibili. GitHub CLI (`gh`) non era installata. L’accesso all’account **GabrielePellerito** è stato verificato in sola lettura; nessun repository è stato creato e nessun push è stato eseguito.

Proposta: repository pubblico **`GabrielePellerito/gabrielepellerito.github.io`**. Il nome risultava disponibile al controllo; va ricontrollato prima di crearlo. Il suo URL Pages previsto è `https://gabrielepellerito.github.io/`: **non è un URL di pubblicazione verificato**.

Puoi ricontrollare le credenziali senza mostrarle:

```powershell
npm.cmd run github:status
```

La creazione del repository pubblico, il push e l’attivazione di Pages richiedono la tua conferma. Per completare manualmente dopo aver deciso di pubblicare:

1. Apri <https://github.com/new> e crea `gabrielepellerito.github.io` nell’account GabrielePellerito, **Public**, senza inizializzarlo con README, licenza o `.gitignore`.
2. Finché il dominio non è posseduto e configurato, cambia `seo.url` in `content/site.json` in `https://gabrielepellerito.github.io/`, poi esegui `node scripts/update.mjs`. Lascia **CNAME.example** con quel nome: un file `CNAME` attiverebbe il dominio anticipatamente.
3. Da questa cartella, dopo aver revisionato i file:

   ```powershell
   git add .
   git commit -m "Prepara sito personale"
   git remote add origin https://github.com/GabrielePellerito/gabrielepellerito.github.io.git
   git push -u origin main
   ```

   Se esiste già il commit iniziale e non ci sono modifiche, salta il commit. Se esiste già `origin`, controllalo con `git remote -v` prima di cambiarlo.

4. Nel repository apri **Settings → Pages → Build and deployment → Source: Deploy from a branch**. Seleziona **main**, cartella **/(root)** e premi **Save**. Non occorre un workflow personalizzato né una build Node. GitHub può comunque eseguire il proprio workflow interno di distribuzione.
5. Attendi il completamento della distribuzione e apri l’URL indicato da **Visit site**. Controlla risposta HTTP 200, nome corretto, CSS, navigazione e assenza di errori. Non considerare conclusa la pubblicazione finché il sito pubblico non è stato verificato.

Fonte: [configurare la pubblicazione da un branch](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Collegare gabrielepellerito.com e www

Non è stato verificato che il dominio sia acquistato o disponibile all’acquisto. GitHub Pages offre l’hosting gratuito, mentre l’eventuale registrazione e rinnovo del dominio sono separati. Non sono stati effettuati acquisti o cambi DNS.

Indirizzo canonico finale scelto: **https://gabrielepellerito.com/**. La variante `www` dovrà reindirizzare a questo indirizzo.

Procedura, soltanto quando possiedi il dominio e autorizzi le modifiche:

1. Nelle **impostazioni personali GitHub → Pages → Add a domain**, aggiungi `gabrielepellerito.com`. GitHub mostrerà un record TXT di verifica specifico dell’account: copialo nel DNS esattamente come indicato, poi premi **Verify**. Mantieni quel TXT. Non si può anticipare il valore univoco.
2. Nel **repository → Settings → Pages → Custom domain**, inserisci `gabrielepellerito.com` e salva **prima** di indirizzare i record di traffico verso GitHub. Con la pubblicazione da branch, GitHub crea il file `CNAME` con questo valore.
3. Esegui `git pull --ff-only` per recuperare il commit remoto del CNAME. In alternativa, se non è già stato creato, copia `CNAME.example` in `CNAME`, committa e pubblica. Il contenuto deve essere una sola riga: `gabrielepellerito.com`.
4. Nel pannello DNS del registrar crea questi record (valori dalla documentazione ufficiale GitHub, consultata il 27 ottobre 2026):

   | Tipo | Nome / host | Valore |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | gabrielepellerito.github.io |

   Per IPv6 puoi aggiungere, **insieme agli A**, anche:

   | Tipo | Nome / host | Valore |
   | --- | --- | --- |
   | AAAA | @ | 2606:50c0:8000::153 |
   | AAAA | @ | 2606:50c0:8001::153 |
   | AAAA | @ | 2606:50c0:8002::153 |
   | AAAA | @ | 2606:50c0:8003::153 |

   `@` indica il dominio principale; alcuni provider vogliono il campo vuoto o il nome completo. Il CNAME DNS di `www` punta al dominio dell’account GitHub, senza `https://`, percorso o nome repository. È distinto dal file `CNAME` del sito. Controlla ed elimina soltanto record web in conflitto; conserva i record di posta e gli altri servizi. Non usare record wildcard `*`.

5. Attendi la propagazione, che può richiedere fino a 24 ore. In PowerShell puoi controllare:

   ```powershell
   Resolve-DnsName gabrielepellerito.com -Type A
   Resolve-DnsName gabrielepellerito.com -Type AAAA
   Resolve-DnsName www.gabrielepellerito.com -Type CNAME
   ```

6. Attendi il certificato di GitHub Pages e abilita **Enforce HTTPS**. L’opzione può richiedere fino a 24 ore per diventare disponibile. Con apex e `www` configurati e l’apex come Custom domain, GitHub gestisce il reindirizzamento da `www` all’apex.
7. Imposta `seo.url` su `https://gabrielepellerito.com/`, esegui `node scripts/update.mjs`, committa e fai push. Verifica HTTPS sul dominio principale e il reindirizzamento di `https://www.gabrielepellerito.com/`, anche per i percorsi. Invia la sitemap ai motori di ricerca se desideri.

Fonti ufficiali: [record DNS e dominio personalizzato](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [verifica del dominio](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages), [HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

## Pubblicare gli aggiornamenti successivi

Dopo aver configurato una volta repository, remote e Pages:

```powershell
node scripts/update.mjs
node scripts/check.mjs
git add .
git commit -m "Aggiorna informazioni personali"
git push
```

GitHub Pages pubblicherà i file aggiornati dal branch `main`. Il comando di aggiornamento serve soltanto quando cambi il JSON dei contenuti; modifiche dirette al CSS e al JavaScript si pubblicano con il normale commit e push.

## Prestazioni e sicurezza

Nessun framework, backend, database, servizio di analytics o risorsa esterna aggiunta. HTML e contenuti sono disponibili senza JavaScript. Il tema usa soltanto `localStorage`; i collegamenti esterni si aprono con `noopener noreferrer`. La copia dell’email è disponibile solo quando il browser consente l’API Clipboard; il link email rimane utilizzabile.

I testi del JSON vengono sottoposti a escaping; non sono interpretati come HTML. Gli URL di progetto e social devono essere HTTPS. La homepage usa una Content Security Policy via meta tag e un hash per il JSON-LD, rigenerato insieme all’HTML. Gli header HTTP dell’hosting sono gestiti da GitHub Pages: un file `_headers` non è supportato da questo hosting e non è stato aggiunto.

Le dipendenze npm sono esclusivamente strumenti di sviluppo e non vengono caricate dal sito. Non pubblicare `node_modules`, output dei test o screenshot di revisione: sono esclusi tramite `.gitignore`.
