<!-- BOZZA. Il testo tra [parentesi quadre] va completato e l'intera informativa va approvata dal DPO prima dell'attivazione (ANALYTICS_SPEC §12). Una modifica sostanziale richiede di aumentare POLICY_V e POLICY_DATE in src/lib/consent.ts. -->

# Privacy e tracciamento

Questa pagina spiega quali dati vengono trattati quando si consulta questo report e quali scelte sono disponibili. È resa ai sensi dell'art. 13 del Regolamento (UE) 2016/679 (GDPR).

## Chi tratta i dati

- **Titolare del trattamento:** [Titolare del trattamento, es. Università / Dipartimento, indirizzo]
- **Responsabile della protezione dei dati (DPO):** [contatto del DPO]
- **Contatto per lo studio:** [nome e indirizzo e-mail istituzionale]

## Perché trattiamo i dati

Il report fa parte di uno studio di ricerca di [istituzione] sui claim ambientali nei siti web delle imprese. Con il tuo consenso misuriamo **quanto il report viene consultato**, per capire se e come le imprese lo utilizzano. La misurazione è facoltativa: il report funziona allo stesso modo sia che tu accetti sia che tu rifiuti.

## Cosa registriamo, se accetti

- l'apertura del report e le sezioni visualizzate (Panoramica, Esempi di claim, Come leggerlo, Metodologia);
- quali claim vengono aperti, identificati da un codice tecnico e non dal loro testo;
- i clic verso le pagine di origine sul sito dell'impresa e verso il sito stesso (il fatto del clic, non l'indirizzo);
- l'uso dei filtri e il cambio di lingua;
- il tempo di utilizzo attivo della pagina;
- la lingua dell'interfaccia e se lo schermo è stretto o largo;
- il momento in cui hai accettato e la versione di questa informativa.

Questi dati sono collegati all'**impresa** tramite un codice pseudonimo, non alla persona che consulta il report. Più persone della stessa impresa vengono contate insieme.

## Cosa non registriamo

Indirizzi IP, nomi, indirizzi e-mail, nome o identificativo dell'impresa, indirizzi delle pagine, testo dei claim, registrazioni dello schermo o della sessione, dati provenienti da altri siti. Non usiamo cookie né altri identificativi persistenti: l'identificativo della visita resta in memoria e si perde alla chiusura o al ricaricamento della pagina.

## Base giuridica

Il tuo consenso (art. 6, par. 1, lett. a GDPR e art. 122 del Codice in materia di protezione dei dati personali). Puoi revocarlo in qualsiasi momento in fondo a questa pagina: la misurazione si interrompe subito. La revoca non pregiudica la liceità del trattamento precedente.

## Chi riceve i dati

- **PostHog Inc.**, in qualità di responsabile del trattamento, conserva i dati di misurazione sulla propria piattaforma cloud nell'Unione europea (Francoforte). [Riferimento all'accordo sul trattamento dei dati e alle garanzie per i trasferimenti]
- **GitHub Inc.** ospita il sito (GitHub Pages) e, come per ogni sito ospitato, registra gli indirizzi IP dei visitatori per finalità di sicurezza. GitHub non memorizza nulla sul dispositivo e il gruppo di ricerca non ha accesso a questi registri.
- Ai dati di misurazione accedono solo i ricercatori incaricati: [chi ha accesso].

## Per quanto tempo

I dati di misurazione sono conservati per [periodo di conservazione da definire, massimo 12 mesi] e poi cancellati o conservati solo in forma aggregata.

## Strumenti utilizzati sul dispositivo

La tabella indica chi fornisce gli strumenti, a cosa servono e per quanto tempo rimangono attivi o memorizzati sul dispositivo.

| Fornitore | Nome dello strumento | Finalità | Durata |
|---|---|---|---|
| [Titolare del trattamento] (strumento proprio del sito) | `fcd.passcode` (sessionStorage) | Funzionamento: mantiene il report sbloccato durante la sessione, senza dover reinserire la passphrase | Fino alla chiusura della scheda del browser |
| [Titolare del trattamento] (strumento proprio del sito) | `fcd.lang` (localStorage) | Memorizzazione della scelta: ricorda la lingua selezionata (italiano/inglese) | Finché l'utente non cancella i dati del sito dal browser |
| [Titolare del trattamento] (strumento proprio del sito) | `fcd.consent` (localStorage) | Memorizzazione della scelta: ricorda se l'utente ha accettato o rifiutato la misurazione facoltativa | 6 mesi, poi la scelta viene richiesta di nuovo |
| PostHog Inc., piattaforma cloud UE (Francoforte), in qualità di responsabile del trattamento | PostHog (libreria `posthog-js`) | Misurazione facoltativa dell'uso del report: sezioni aperte, claim consultati, clic verso le pagine di origine, tempo di utilizzo attivo. I dati sono collegati all'impresa tramite un codice pseudonimo, non alla persona. Attiva solo previo consenso | Sul dispositivo: nessun cookie e nessun dato memorizzato; l'identificativo della visita resta in memoria solo fino alla chiusura o al ricaricamento della pagina. Sui server di PostHog: [periodo di conservazione da definire, massimo 12 mesi] |

## I tuoi diritti

Puoi chiedere al titolare l'accesso ai dati, la rettifica, la cancellazione, la limitazione del trattamento e la portabilità, e puoi revocare il consenso, scrivendo ai contatti indicati sopra. Hai inoltre il diritto di proporre reclamo al [Garante per la protezione dei dati personali](https://www.garanteprivacy.it).
