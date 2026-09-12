import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  findArticleByPrompt, 
  findAllRelevantArticles,
  searchArticlesByKeywords, 
  formatLegalArticle 
} from '@/lib/legislation/search';
import { calculateCost } from '@/lib/expenseTracker';

function normalizeRo(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s]/g, ' ');
}

function stemRo(word: string): string {
  const norm = normalizeRo(word).trim();
  if (norm.length <= 3) return norm;
  return norm
    .replace(/(atilor|itilor|arilor|urilor|ilor|elor|ator)$/, '')
    .replace(/(ului|ele|ilor|ului|ate|ite|ati|iti|esc|easca|uti)$/, '')
    .replace(/(ul|ea|ii|ei|ia|ie|at|it|ut|ar|er|or|i|e|a)$/, '');
}

export function cleanModelResponse(raw: string): string {
  let text = raw;

  // 1. Remove transition markers like "Let's go." or "Let's go.###"
  text = text.replace(/Let's go\.?\s*/gi, '\n');

  // 2. The real answer always starts at the final occurrence of the official legal title "### ⚖️" or "### Articolul"
  const legalTitleMatches = [...text.matchAll(/(?:^|\n|[.\s])(###\s*(?:⚖️|Articolul|Art\.|Codul|Dispoziții|Răspuns)[^\n]*)/gi)];
  if (legalTitleMatches.length > 0) {
    const lastMatch = legalTitleMatches[legalTitleMatches.length - 1];
    const idx = text.lastIndexOf(lastMatch[1]);
    if (idx !== -1) {
      return text.substring(idx).trim();
    }
  }

  // 3. If there is a scratchpad/draft present, take from the last markdown header
  const hasScratchpad = /^(User Question|Source Material|Role:|Constraints:|Check against|Self-Correction|Final Polish|Final structure)/im.test(text);
  const allHeaders = [...text.matchAll(/(?:^|\n)(#{1,3}\s+[^\n]+)/g)];
  if (allHeaders.length > 0) {
    if (hasScratchpad) {
      const lastHeader = allHeaders[allHeaders.length - 1];
      const idx = text.lastIndexOf(lastHeader[1]);
      if (idx !== -1) {
        return text.substring(idx).trim();
      }
    } else {
      const firstHeader = allHeaders[0];
      const idx = text.indexOf(firstHeader[1]);
      if (idx !== -1) {
        return text.substring(idx).trim();
      }
    }
  }

  // 4. Filter out any remaining scratchpad lines
  return text
    .split('\n')
    .filter(line => !/^(User Question|Source Material|Context|Constraints|Role|Points|Categories|Check against|RM Law|Title|Draft|List|Header|Subheader|\*   ):/i.test(line.trim()))
    .join('\n')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, mode, context, apiKey: userApiKey, requestedModel } = body;

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt-ul este obligatoriu' }, { status: 400 });
    }

    // 1. Check official Republic of Moldova legislation database for all relevant articles
    const allRelevantArticles = findAllRelevantArticles(prompt);
    const matchedOfficialArticle = allRelevantArticles.length > 0 ? allRelevantArticles[0] : findArticleByPrompt(prompt);
    
    // Also check if any uploaded document in context has a pinpointed article
    let contextArticleSnippet = '';
    const artMatch = prompt.match(/(?:art|articolul|articol)\.?\s*([0-9]+(?:\^?[0-9]*))/i);
    if (artMatch && context) {
      const artNum = artMatch[1];
      const artRegex = new RegExp("(?:Articolul|Art\\.)\\s*" + artNum + "\\b[\\s\\S]{1,4000}?(?=(?:Articolul|Art\\.)\\s*[0-9]+|\\Z)", "i");
      const foundSnippet = context.match(artRegex);
      if (foundSnippet) {
        contextArticleSnippet = foundSnippet[0].trim();
      }
    }

    // Construct authoritative grounding block with all referenced and correlated legal texts
    let legalGroundingBlock = '';
    if (allRelevantArticles.length > 0) {
      legalGroundingBlock = `\n\n🎯 ACTE ȘI ARTICOLE OFICIALE DIN LEGISLAȚIA REPUBLICII MOLDOVA:\n` +
        allRelevantArticles.map(a => `
---
Act normativ: ${a.code}
Articolul: ${a.number} — ${a.title}
Text integral oficial:
"""
${a.text}
"""`).join('\n\n') + `

REGULI FACTUALE STRICTE DE CLASIFICARE ȘI APLICARE:
1. CLASIFICAREA INFRACȚIUNILOR (art. 16 CP RM):
   - Ușoare: maxim până la 2 ani inclusiv;
   - Mai puțin grave: maxim până la 5 ani inclusiv;
   - Grave: maxim până la 12 ani inclusiv;
   - DEOSEBIT DE GRAVE: infracțiuni intenționate pentru care legea prevede pedeapsa maximă ce DEPĂȘEȘTE 12 ANI.
     *ATENȚIE:* Art. 151 alin. (4) CP RM prevede închisoare de la 12 la 15 ani. Deoarece maximul (15 ani) depășește 12 ani, această faptă este OBLIGATORIU infracțiune DEOSEBIT DE GRAVĂ (și NU infracțiune gravă)!
   - Excepțional de grave: detențiune pe viață.
2. DEPLASAREA FĂRĂ ESCORTĂ (art. 216 alin. 3 Cod de executare al RM):
   - Este STRICT INTERZISĂ deplasarea fără escortă sau însoțire a condamnaților care au săvârșit o infracțiune DEOSEBIT DE GRAVĂ sau excepțional de gravă.
   - Condamnatul în baza art. 151 alin. (4) CP RM (infracțiune deosebit de gravă) NU POATE BENEFICIA SUB NICIO FORMĂ de deplasare fără escortă!`;
    } else if (contextArticleSnippet) {
      legalGroundingBlock = `\n\n🎯 TEXTUL INTEGRAL AL ARTICOLULUI EXTRAS DIN DOCUMENTELE TALE:
"""
${contextArticleSnippet}
"""

DIRECTIVĂ STRICTĂ: Bazează-te STRICT pe fragmentul oficial de mai sus extras din document!`;
    }

    // 2. If an API key is provided, run Live Gemini
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);

      const systemInstruction = `Ești un asistent juridic de elită specializat exclusiv în legislația oficială a REPUBLICII MOLDOVA în NotebookLM.

NORME ȘI REGULI FACTUALE STRICTE PRIVIND LEGISLAȚIA REPUBLICII MOLDOVA:
1. CADRU JURIDIC EXCLUSIV ȘI SUVERAN AL REPUBLICII MOLDOVA: 
   - Utilizezi EXCLUSIV legislația oficială a Republicii Moldova adoptată de Parlamentul Republicii Moldova și publicată în Monitorul Oficial al Republicii Moldova (Registrul de Stat al Actelor Juridice legis.md):
     * **Codul contravențional al Republicii Moldova nr. 218/2008** (cu modificările la zi);
     * **Codul penal al Republicii Moldova nr. 985/2002**;
     * **Codul de executare al Republicii Moldova nr. 443/2004**;
     * **Codul de procedură penală al Republicii Moldova nr. 122/2003**;
     * **Regulamentul circulației rutiere al Republicii Moldova** (HG RM nr. 357/2009);
     * **Legea nr. 131/2007 privind siguranța traficului rutier din RM**;
     * **Legea nr. 320/2012 cu privire la activitatea Poliției și statutul polițistului**.
   - **INTERDICȚIE ABSOLUTĂ:** Este STRICT INTERZISĂ utilizarea oricăror legi, ordonanțe, articole sau denumiri din România (cum ar fi OG nr. 2/2001, OUG nr. 195/2002, Codul penal român etc.) sau alte jurisdicții străine. Răspunsul tău trebuie să fie 100% ancorat în dreptul Republicii Moldova.

2. SPECIFICUL DREPTULUI CONTRAVENȚIONAL AL REPUBLICII MOLDOVA (Codul Contravențional nr. 218/2008):
   - **Unitatea convențională (u.c.):** O unitate convențională de amendă în Republica Moldova este egală cu **50 lei moldovenești (MDL)** (art. 34 alin. 1 CC RM).
   - **Facilitatea de achitare (50% în 3 zile):** Contravenientul este în drept să achite **50% din amenda stabilită** dacă o plătește în cel mult **3 zile lucrătoare** de la data aducerii la cunoștință a deciziei de aplicare a sancțiunii (art. 34 alin. 3 CC RM).
   - **Prescripția răspunderii contravenționale (art. 30 CC RM):** Termenul general de prescripție a răspunderii contravenționale este de **1 an** de la data săvârșirii faptei (sau de la data încetării în cazul contravenției continue/prelungite - art. 18 CC RM).
   - **Contestarea procesului-verbal (art. 448 CC RM):** Contestația împotriva procesului-verbal/deciziei agentului constatator se depune în termen de **15 zile** de la data aducerii la cunoștință.
   - **Nulitatea procesului-verbal (art. 443, 445 CC RM):** Lipsa mențiunilor esențiale (data, identitatea agentului/contravenientului, descrierea faptei, încadrarea juridică, semnătura agentului) atrage nulitatea absolută a procesului-verbal.

3. EXECUTAREA SANCȚIUNILOR CONTRAVENȚIONALE ȘI A ARESTULUI (Codul de executare al RM nr. 443/2004 - Titlul III):
   - **EXECUTAREA MAI MULTOR HOTĂRÂRI / ÎNCHEIERI PE ACEEAȘI PERSOANĂ (art. 312 alin. 3 Cod de executare RM):**
     * Prevederea imperativă expresă: **„În cazul pronunţării câtorva hotărâri privind aplicarea sancţiunilor contravenţionale referitor la una şi aceeaşi persoană, fiecare hotărâre se execută separat.”** (art. 312 alin. 3 CE RM).
     * Dacă pe numele aceleiași persoane sunt emise 2 (sau mai multe) hotărâri/încheieri judecătorești diferite de aplicare a arestului contravențional, acestea **NU se absorb și NU se contopesc la executare**. Fiecare hotărâre de arest se execută **separat și succesiv** (durata celei de-a doua hotărâri curge după executarea primei).
   - **Trimiterea spre executare a arestului contravențional (art. 312 alin. 1 și alin. 2 CE RM):**
     * Trimiterea revine instanței de judecată emitente.
     * Hotărârile privind arestul contravențional față de persoanele aflate în libertate se expediază **organului afacerilor interne (Poliției)** din raza domiciliului contravenientului pentru reținerea și escortarea lui la locul de deținere (art. 312 alin. 2 CE RM).
   - **Instituția de executare a arestului contravențional (art. 313 alin. 3 și art. 318 CE RM):**
     * Executarea sancțiunii arestului contravențional se asigură de către **penitenciare**, în condițiile stabilite pentru regim inițial într-un penitenciar de tip semiînchis (art. 318 alin. 1 CE RM).

4. REGULI CRUCIALE DIN CODUL PENAL AL RM (nr. 985/2002):
   - **Art. 186 CP RM este STRICT „FURTUL”**:
     * Sustragerea pe ascuns a bunurilor altei persoane este „Furtul” (art. 186).
     * Este strict interzisă denumirea art. 186 drept „pungășie”.
     * **„Pungășia”** este o infracțiune distinctă, reglementată separat la **art. 192 CP RM** (acțiunea în scopul sustragerii bunurilor altei persoane din buzunare, genți sau din alte obiecte prezente la persoană).
   - **FRACȚIUNILE LA ART. 91 VS ART. 92 CP RM SE DEOSEBESC NET (Art. 92 NU preia fracțiunile de la art. 91!)**:
     * **Art. 91 alin. (4) CP RM (Liberarea condiționată de pedeapsă înainte de termen - adulți peste 21 ani)**:
       - Infracțiuni ușoare sau mai puțin grave: cel puțin **jumătate (1/2)** din termenul stabilit (dar nu mai puțin de 90 de zile de închisoare);
       - Infracțiuni grave, deosebit de grave sau excepțional de grave: cel puțin **două treimi (2/3)**.
     * **Art. 92 alin. (2) CP RM (Înlocuirea părții neexecutate a pedepsei cu o pedeapsă mai blândă)**:
       - Infracțiuni ușoare sau mai puțin grave: cel puțin **o treime (1/3)** din pedeapsă (diferit de 1/2 de la art. 91!);
       - Infracțiuni grave: cel puțin **jumătate (1/2)** din pedeapsă (diferit de 2/3 de la art. 91!);
       - Infracțiuni deosebit de grave sau excepțional de grave: cel puțin **două treimi (2/3)**.
   - **CLASIFICAREA INFRACȚIUNILOR (art. 16 CP RM) - CRITERII MATEMATICE EXACTE**:
     Infracțiunile se clasifică strict după limita MAXIMĂ a pedepsei prevăzute de articol:
     - **Infracțiuni ușoare**: maxim până la 2 ani de închisoare inclusiv;
     - **Infracțiuni mai puțin grave**: maxim până la 5 ani de închisoare inclusiv;
     - **Infracțiuni grave**: maxim până la 12 ani de închisoare inclusiv (ex: art. 151 alin. 1 - max 10 ani; art. 151 alin. 2 - max 12 ani);
     - **Infracțiuni deosebit de grave**: fapte intenționate pentru care legea prevede pedeapsa maximă ce **DEPĂȘEȘTE 12 ANI**.
       *EXEMPLU CRUCIAL:* Art. 151 alin. (4) CP RM (vătămarea gravă soldată cu decesul victimei) prevede pedeapsa de la 12 la 15 ani. Deoarece limita maximă este de 15 ani (ceea ce DEPĂȘEȘTE 12 ani), această infracțiune este OBLIGATORIU **infracțiune DEOSEBIT DE GRAVĂ** (și NU infracțiune gravă!).
     - **Infracțiuni excepțional de grave**: infracțiuni săvârșite cu intenție pentru care legea prevede detențiune pe viață.

5. INTERDICȚIA DEPLASĂRII FĂRĂ ESCORTĂ (art. 216 alin. 3 Cod de executare al RM):
   - Conform **art. 216 alin. (3) din Codul de executare al RM**, este **STRICT ȘI CATEGORIC INTERZISĂ** deplasarea fără escortă sau însoțire în afara penitenciarului a condamnaților care au săvârșit infracțiuni **DEOSEBIT DE GRAVE** sau excepțional de grave.

6. FORMATUL OBLIGATORIU AL RĂSPUNSULUI (STRUCTURAT ȘI ELEGANT):
   - Începe direct cu: ### ⚖️ [Titlul analizei sau articolului din lege]
   - Subtitlu: > **[Actul normativ oficial din Republica Moldova: Codul contravențional nr. 218/2008 / Codul penal nr. 985/2002 etc.]**
   - Delimitează clar fiecare punct: **(1)**, **(2)**, **(3)** etc.
   - Folosește liniuțe și bold pe termeni esențiali, cifre, termene și sume în lei moldovenești (MDL).
   - Sub-punctele a), b), c) trebuie formatate ca listă cu buline: * **a)** ..., * **b)** ...
   - Include la final o mențiune clară privind temeiul legal oficial din Republica Moldova.

6. REGULĂ ABSOLUTĂ:
   - Outputul TĂU TREBUIE să conțină EXCLUSIV răspunsul final redactat în limba română.
   - ESTE STRICT INTERZISĂ emiterea oricărui proces de gândire, planificare, ciornă, verificare a regulilor, text în limba engleză (ex: „User Question:”, „Role:”, „Constraints:”, „Check against:”, „Self-Correction:”, „Final Polish:”) sau formule de lansare (ex: „Let's go.”).
   - Primul caracter al răspunsului tău trebuie să fie obligatoriu „#”.`;

      const defaultCandidates = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      let candidateModels: string[] = [];
      if (requestedModel) {
        if (requestedModel.includes('flash-lite') || requestedModel.includes('lite')) {
          candidateModels = [
            requestedModel,
            'gemini-3.5-flash-lite',
            'gemini-3.1-flash-lite',
            'gemini-3.6-flash',
            'gemini-3.5-flash',
            'gemini-2.0-flash-lite',
            'gemini-2.0-flash-lite-preview-02-05',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-pro'
          ];
        } else if (requestedModel.includes('3.5') || requestedModel.includes('3.6') || requestedModel.includes('3.8')) {
          candidateModels = [
            requestedModel,
            'gemini-3.5-flash',
            'gemini-3.6-flash',
            'gemini-3.8-flash',
            'gemini-3.1-pro-preview',
            'gemini-2.0-flash',
            'gemini-1.5-pro'
          ];
        } else {
          candidateModels = [requestedModel, ...defaultCandidates];
        }
      } else {
        candidateModels = defaultCandidates;
      }
      candidateModels = Array.from(new Set(candidateModels));

      let discoveredModels: string[] = [];
      try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (listRes.ok) {
          const listData = await listRes.json();
          if (Array.isArray(listData.models)) {
            discoveredModels = listData.models
              .filter((m: any) => 
                m.supportedGenerationMethods?.includes('generateContent') &&
                !m.name?.includes('-tts') &&
                !m.name?.includes('audio') &&
                !m.name?.includes('imagen')
              )
              .map((m: any) => m.name?.replace(/^models\//, ''))
              .filter(Boolean);
          }
        }
      } catch (e) {
        console.warn('Could not query model list:', e);
      }

      const modelsToTry = discoveredModels.length > 0
        ? Array.from(new Set([...candidateModels.filter(m => discoveredModels.includes(m)), ...candidateModels, ...discoveredModels]))
        : candidateModels;

      let lastErrorMsg = '';
      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: systemInstruction,
            generationConfig: {
              temperature: 0.05,
              topP: 0.8,
            }
          });
          const userPrompt = `${legalGroundingBlock}\n\n=== DOCUMENTE ȘI SURSE ÎNCĂRCATE DE UTILIZATOR ===\n${context || 'Fără surse adiționale'}\n\n=== ÎNTREBAREA UTILIZATORULUI ===\n${prompt}`;
          const result = await model.generateContent(userPrompt);
          let responseText = result.response.text();
          if (responseText) {
            const cleanText = cleanModelResponse(responseText);

            // Compute usage metadata and exact expenses
            const usageMetadata = (result.response as any).usageMetadata;
            const promptTokens = usageMetadata?.promptTokenCount || Math.ceil(userPrompt.length / 4);
            const candidateTokens = usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4);
            const totalTokens = usageMetadata?.totalTokenCount || (promptTokens + candidateTokens);
            const cost = calculateCost(modelName, promptTokens, candidateTokens);

            return NextResponse.json({ 
              reply: cleanText, 
              source: matchedOfficialArticle ? 'official-rm-legislation+gemini' : 'gemini-api',
              model: modelName,
              usage: {
                promptTokens,
                candidateTokens,
                totalTokens,
                costUSD: cost.costUSD,
                costMDL: cost.costMDL
              }
            });
          }
        } catch (callErr: any) {
          lastErrorMsg = callErr?.message || 'Eroare necunoscută la apelul modelului';
          console.warn(`Model ${modelName} failed:`, lastErrorMsg);
        }
      }

      // If key was provided but all models failed, fall back to official legal article if available
      if (matchedOfficialArticle) {
        return NextResponse.json({
          reply: `${formatLegalArticle(matchedOfficialArticle)}

> *(Notă: Conexiunea Gemini a întâmpinat o eroare: \`${lastErrorMsg}\`. Ți-am afișat direct textul oficial garantat din baza de date consolidată a legislației RM).*`,
          source: 'official-rm-legislation'
        });
      }

      return NextResponse.json({
        reply: `⚠️ **Nu am putut conecta cheia Google Gemini API:**

Google a returnat următoarea eroare:
> \`${lastErrorMsg}\`

**Cauze frecvente:**
1. Cheia API a fost creată pe un proiect fără „Generative Language API” activat.
2. Generați o cheie nouă gratuită din [Google AI Studio (aistudio.google.com/app/apikey)](https://aistudio.google.com/app/apikey).`,
        source: 'gemini-api-error'
      });
    }

    // 3. If NO API key provided, but user asked about an article: return official formatted article directly!
    if (matchedOfficialArticle) {
      return NextResponse.json({
        reply: formatLegalArticle(matchedOfficialArticle),
        source: 'official-rm-legislation'
      });
    }

    // 4. Intelligent Extractive Document Search (Local Mode without API Key)
    const stopWords = new Set([
      'care', 'sunt', 'este', 'pentru', 'despre', 'cum', 'cand', 'unde', 'de', 'la', 'in', 'si', 'sau', 
      'cu', 'din', 'pe', 'un', 'o', 'ai', 'ale', 'al', 'the', 'is', 'at', 'which', 'on', 'ce', 'va', 'sa',
      'rog', 'spune', 'trebuie', 'te', 'vreau', 'arata', 'da'
    ]);

    const queryKeywords = normalizeRo(prompt)
      .split(/\s+/)
      .filter((w: string) => w.length >= 3 && !stopWords.has(w));
    
    const queryStems = queryKeywords.map(stemRo).filter(s => s.length >= 3);

    // If context has text content from sources
    if (context && context.length > 30 && !context.includes('Fără surse încărcate')) {
      const chunks = context
        .split(/(?<=[.!?;\n])\s+/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 20);

      const scored = chunks.map((chunk: string) => {
        const normChunk = normalizeRo(chunk);
        let score = 0;
        let matchedTerms: string[] = [];

        for (let i = 0; i < queryKeywords.length; i++) {
          const kw = queryKeywords[i];
          const stem = queryStems[i];

          if (normChunk.includes(kw)) {
            score += 3;
            matchedTerms.push(kw);
          } else if (normChunk.includes(stem)) {
            score += 2;
            matchedTerms.push(stem);
          }
        }
        return { chunk, score, matchedTerms };
      });

      scored.sort((a: any, b: any) => b.score - a.score);
      const topMatches = scored.filter((s: any) => s.score > 0).slice(0, 5);

      if (topMatches.length > 0) {
        const replyText = `### 📄 Răspuns extras din documentele tale (${topMatches.length} pasaje găsite):

${topMatches.map((m: any, i: number) => `**Fragment ${i + 1}:**\n> „${m.chunk}”\n`).join('\n')}

---
ℹ️ *Extragere locală pe baza termenilor: ${queryKeywords.join(', ')}.*
*Pentru ca Gemini să formuleze un răspuns conversațional elaborat, conectați o cheie validă Google Gemini API.*`;
        return NextResponse.json({ reply: replyText, source: 'local-extractive' });
      }

      return NextResponse.json({
        reply: `### 🔍 Căutare în documente:
Am căutat în documentele încărcate după termenii: **${queryKeywords.join(', ')}**, dar nu am găsit pasaje relevante.

**Sfat:** Verificați conținutul text al sursei dând click pe ea în panoul din stânga, sau reformulați întrebarea.`,
        source: 'local-extractive'
      });
    }

    // Check keyword search in official legislation as fallback
    const keywordArticles = searchArticlesByKeywords(prompt, 2);
    if (keywordArticles.length > 0) {
      const reply = `### ⚖️ Articole relevante identificate în legislația RM:

${keywordArticles.map(a => `#### ${a.title} (${a.abbr} Articolul ${a.number})
${a.text.slice(0, 500)}...
`).join('\n---\n\n')}

---
ℹ️ *Rezultate extrase din Codurile oficiale ale Republicii Moldova.*`;
      return NextResponse.json({ reply, source: 'official-rm-legislation' });
    }

    // No sources loaded
    return NextResponse.json({
      reply: `### ℹ️ Notă despre surse:
Notebook-ul nu are fișiere încărcate pentru a răspunde la întrebare. Folosiți butonul **„Încarcă Fișier”** din stânga pentru a adăuga documentele dorite sau întrebați direct despre orice articol din Codul penal, de executare sau procedură penală al RM.`,
      source: 'local-extractive'
    });

  } catch (error: any) {
    console.error('Gemini route error:', error);
    return NextResponse.json({ error: error?.message || 'Eroare internă server' }, { status: 500 });
  }
}
