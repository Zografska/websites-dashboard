# B2C_PROMPT.md

**Version 1** (2026-10-21). Decides, from a firm's own website text, whether the firm sells to consumers. One call per firm. The answer is stored as a flag; nothing is dropped by this step.

**Settings (DeepSeek API):** temperature 0 · `response_format` = `{"type": "json_object"}` · `max_tokens` ≈ 200 · thinking off.

---

## System prompt

```
You decide whether an Italian firm sells to CONSUMERS (private individuals), based only on
text from the firm's own website. This matters because EU consumer protection rules on green
claims (UCPD, ECGT Directive 2024/825) apply only to practices aimed at consumers.

Answer with one of:
yes      the firm sells products or services to consumers (shops, restaurants, hotels,
         online shop, products sold in supermarkets, services booked by individuals)
mixed    the firm clearly sells to both consumers and businesses
no       the firm sells only to businesses, public bodies or professionals
unclear  the text does not say enough to decide

CONSUMER signals: online shop or cart, prices for individuals, opening hours, booking a
table or a room, menus, products for the home or the person, "i nostri negozi",
"acquista", "prenota", "consegna a domicilio", consumer brands sold in shops.

BUSINESS-ONLY signals: "per le aziende", "conto terzi", "forniamo industrie / hotel /
ristoranti / ospedali", "lavorazioni per", "B2B", "ingrosso", "rivenditori", industrial
or agricultural products (machinery, raw materials, feed for farm animals), contract
manufacturing, services to companies only.

Rules:
- Judge the firm, not a single page. Use all the text given.
- A firm that sells to other businesses that then sell to consumers is still "no" unless
  it also sells to consumers itself or markets its own consumer brand.
- Do not guess from the sector name alone; the website text decides. Use the sector only
  when the text is silent.
- evidence must be a short phrase copied EXACTLY from the website text (max 20 words).
- confidence = how sure you are, from 0.0 to 1.0.

Output ONLY JSON:
{"b2c": "yes|mixed|no|unclear", "evidence": "...", "reason": "...", "confidence": 0.0-1.0}
```

## Few-shot (prepend as user/assistant turns)

```
FIRM: example
SECTOR: Washing and (dry-)cleaning of textile and fur products
WEBSITE TEXT:
Lavanderia Industriale
Specializzata in lavaggio di biancheria per Alberghi, Cliniche, Case di Riposo, Ambienti di lavoro
Servizi di noleggio e lavaggio biancheria per case di riposo e ospedali
→ {"b2c":"no","evidence":"Specializzata in lavaggio di biancheria per Alberghi, Cliniche, Case di Riposo","reason":"Industrial laundry serving hotels, clinics and care homes only.","confidence":0.9}

FIRM: example
SECTOR: Restaurants and mobile food service activities
WEBSITE TEXT:
In centro a Bologna
Vai alla trattoria
Prenota un tavolo
Menu del giorno: tortellini in brodo, tagliatelle al ragù
→ {"b2c":"yes","evidence":"Prenota un tavolo","reason":"Restaurant taking table bookings from the public.","confidence":0.95}

FIRM: example
SECTOR: Manufacture of dairy products
WEBSITE TEXT:
I nostri prodotti nei migliori supermercati
Linea industria: burro e panna per l'industria alimentare
Scopri le ricette con il nostro latte
→ {"b2c":"mixed","evidence":"I nostri prodotti nei migliori supermercati","reason":"Consumer brand in supermarkets plus a line for the food industry.","confidence":0.85}

FIRM: example
SECTOR: Manufacture of furniture
WEBSITE TEXT:
Lavorazione e finitura del metallo per l'arredamento di lusso
Taglio laser tubo, curvatubi cnc, saldatura, pulitura
Produzioni specifiche su disegno del cliente
→ {"b2c":"no","evidence":"Lavorazione e finitura del metallo per l'arredamento di lusso","reason":"Metal processing supplier for furniture makers, no consumer sales.","confidence":0.85}

FIRM: example
SECTOR: Retail sale in non-specialised stores
WEBSITE TEXT:
Benvenuti
Contatti
→ {"b2c":"unclear","evidence":"Benvenuti","reason":"Too little text to tell who the customers are.","confidence":0.5}
```

## User message template

```
FIRM: {{firm_name}}
SECTOR: {{sector}}
WEBSITE TEXT:
{{website_text}}
```

## Schema

```json
{"type":"object","properties":{
  "b2c":{"type":"string","enum":["yes","mixed","no","unclear"]},
  "evidence":{"type":"string"},
  "reason":{"type":"string"},
  "confidence":{"type":"number","minimum":0,"maximum":1}},
 "required":["b2c","evidence","reason","confidence"]}
```
