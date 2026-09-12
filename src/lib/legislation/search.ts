import rmCodesData from './rm-codes.json';

export interface LegalArticle {
  code: string;
  abbr: 'CP' | 'CE' | 'CPP' | 'CC';
  number: string;
  title: string;
  text: string;
}

let cachedArticles: LegalArticle[] | null = null;

export function getLegislationArticles(): LegalArticle[] {
  if (cachedArticles) return cachedArticles;
  if (Array.isArray(rmCodesData)) {
    cachedArticles = rmCodesData as LegalArticle[];
    return cachedArticles;
  }
  return [];
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Searches for a specific legal article in RM Codes (CP, CE, CPP, CC) based on user prompt.
 */
export function findArticleByPrompt(prompt: string): LegalArticle | null {
  const norm = normalizeText(prompt);
  const articles = getLegislationArticles();
  
  // Match patterns like: "art. 96", "articolul 92", "art 91", "articol 205", "art. 96^1", "art 96-1", "art. 443"
  const match = prompt.match(/(?:art|articolul|articol)\.?\s*([0-9]+(?:\^?[0-9]*))/i);
  if (!match) return null;
  const num = match[1].replace('-', '^');

  // Determine code preference if specified in prompt
  let preferredAbbr: 'CP' | 'CE' | 'CPP' | 'CC' | null = null;
  if (
    norm.includes('contravention') ||
    norm.includes('contraventie') ||
    norm.includes('contraventi') ||
    norm.includes('cc rm') ||
    norm.includes('proces verbal') ||
    norm.includes('agent constatator') ||
    norm.includes('puncte de penalizare') ||
    norm.includes('circulatiei rutiere') ||
    norm.includes('rcr') ||
    norm.includes('amenda contraventionala') ||
    norm.includes('sanctiune contraventionala') ||
    norm.includes('arest contraventional') ||
    norm.includes('nulitatea procesului')
  ) {
    preferredAbbr = 'CC';
  } else if (
    norm.includes('executare') || 
    norm.includes('ce rm') || 
    norm.includes('penitenciar') || 
    norm.includes('detinere')
  ) {
    preferredAbbr = 'CE';
  } else if (
    norm.includes('procedura penala') || 
    norm.includes('cpp') || 
    norm.includes('urmarire penala')
  ) {
    preferredAbbr = 'CPP';
  } else if (
    norm.includes('codul penal') || 
    norm.includes('cod penal') || 
    norm.includes('cp rm') || 
    norm.includes('infractiun') || 
    norm.includes('pedeaps')
  ) {
    preferredAbbr = 'CP';
  }

  // 1. Try preferred code first
  if (preferredAbbr) {
    const found = articles.find(a => a.abbr === preferredAbbr && a.number === num);
    if (found) return found;
  }

  // 2. Check prioritized matches
  const ccMatch = articles.find(a => a.abbr === 'CC' && a.number === num);
  const cpMatch = articles.find(a => a.abbr === 'CP' && a.number === num);
  const ceMatch = articles.find(a => a.abbr === 'CE' && a.number === num);
  const cppMatch = articles.find(a => a.abbr === 'CPP' && a.number === num);

  if (cpMatch && !preferredAbbr) return cpMatch;
  if (ccMatch) return ccMatch;
  if (cpMatch) return cpMatch;
  if (ceMatch) return ceMatch;
  if (cppMatch) return cppMatch;

  return null;
}

/**
 * Discovers all directly mentioned and topic-related articles (e.g. Art. 151 + Art. 16 + Art. 216)
 */
export function findAllRelevantArticles(prompt: string, allowedAbbrs?: ('CP' | 'CE' | 'CPP' | 'CC')[]): LegalArticle[] {
  const norm = normalizeText(prompt);
  const allArticles = getLegislationArticles();
  const articles = allowedAbbrs && allowedAbbrs.length > 0
    ? allArticles.filter(a => allowedAbbrs.includes(a.abbr))
    : allArticles;
  const isAllowed = (abbr: 'CP' | 'CE' | 'CPP' | 'CC') => !allowedAbbrs || allowedAbbrs.includes(abbr);
  const results: LegalArticle[] = [];

  // 1. Explicit articles mentioned in prompt
  const artMatches = [...prompt.matchAll(/(?:art|articolul|articol)\.?\s*([0-9]+(?:\^?[0-9]*))/gi)];
  for (const m of artMatches) {
    const num = m[1].replace('-', '^');
    const isCC = norm.includes('contravent') || norm.includes('cc rm') || norm.includes('proces verbal') || norm.includes('agent constatator') || norm.includes('amenda contraventionala') || norm.includes('puncte de penalizare');
    const isCE = norm.includes('executare') || norm.includes('ce rm') || norm.includes('penitenciar');
    const isCPP = norm.includes('procedura') || norm.includes('cpp');
    
    let art: LegalArticle | undefined;
    if (isCC && isAllowed('CC')) art = articles.find(a => a.abbr === 'CC' && a.number === num);
    else if (isCE && isAllowed('CE')) art = articles.find(a => a.abbr === 'CE' && a.number === num);
    else if (isCPP && isAllowed('CPP')) art = articles.find(a => a.abbr === 'CPP' && a.number === num);
    else if (isAllowed('CP')) art = articles.find(a => a.abbr === 'CP' && a.number === num);

    if (!art) {
      art = articles.find(a => a.number === num);
    }
    if (art && isAllowed(art.abbr) && !results.some(r => r.abbr === art!.abbr && r.number === art!.number)) {
      results.push(art);
    }
  }

  // 2. Cross-reference: Termenul de prescripție a răspunderii contravenționale (Art. 30 CC)
  if (isAllowed('CC') && norm.includes('prescriptie') && (norm.includes('contravent') || norm.includes('proces verbal') || norm.includes('amenda'))) {
    const cc30 = articles.find(a => a.abbr === 'CC' && a.number === '30');
    if (cc30 && !results.some(r => r.abbr === 'CC' && r.number === '30')) {
      results.push(cc30);
    }
  }

  // 3. Cross-reference: Întocmirea și nulitatea procesului-verbal contravențional (Art. 443 CC)
  if (isAllowed('CC') && (norm.includes('proces verbal') || norm.includes('procesul verbal') || norm.includes('nulitate') || norm.includes('contestat'))) {
    const cc443 = articles.find(a => a.abbr === 'CC' && a.number === '443');
    if (cc443 && !results.some(r => r.abbr === 'CC' && r.number === '443')) {
      results.push(cc443);
    }
    const cc448 = articles.find(a => a.abbr === 'CC' && a.number === '448');
    if (cc448 && !results.some(r => r.abbr === 'CC' && r.number === '448')) {
      results.push(cc448);
    }
  }

  // 4. Cross-reference: Conducerea vehiculului în stare de ebrietate (Art. 233 CC)
  if (isAllowed('CC') && (norm.includes('ebrietate') || norm.includes('alcool') || norm.includes('sub influenta'))) {
    const cc233 = articles.find(a => a.abbr === 'CC' && a.number === '233');
    if (cc233 && !results.some(r => r.abbr === 'CC' && r.number === '233')) {
      results.push(cc233);
    }
  }

  // 5. Cross-reference: Executarea sancțiunilor contravenționale / a arestului contravențional / mai multe hotărâri sau încheieri (Art. 311, 312, 313, 318 CE RM + Art. 38 CC RM)
  if (
    (isAllowed('CE') || isAllowed('CC')) &&
    (norm.includes('executare') || norm.includes('executa') || norm.includes('punere in executare')) &&
    (norm.includes('arest') || norm.includes('contravent') || norm.includes('incheier') || norm.includes('hotarar') || norm.includes('sanctiun') || norm.includes('persoan') || norm.includes('separat'))
  ) {
    if (isAllowed('CE')) {
      const ce312 = articles.find(a => a.abbr === 'CE' && a.number === '312');
      if (ce312 && !results.some(r => r.abbr === 'CE' && r.number === '312')) results.push(ce312);

      const ce318 = articles.find(a => a.abbr === 'CE' && a.number === '318');
      if (ce318 && !results.some(r => r.abbr === 'CE' && r.number === '318')) results.push(ce318);

      const ce311 = articles.find(a => a.abbr === 'CE' && a.number === '311');
      if (ce311 && !results.some(r => r.abbr === 'CE' && r.number === '311')) results.push(ce311);

      const ce313 = articles.find(a => a.abbr === 'CE' && a.number === '313');
      if (ce313 && !results.some(r => r.abbr === 'CE' && r.number === '313')) results.push(ce313);
    }

    if (isAllowed('CC')) {
      const cc38 = articles.find(a => a.abbr === 'CC' && a.number === '38');
      if (cc38 && !results.some(r => r.abbr === 'CC' && r.number === '38')) results.push(cc38);
    }
  }

  // 6. Cross-reference: Deplasare fără escortă / regim (Art. 216 CE)
  if (isAllowed('CE') && (norm.includes('escorta') || norm.includes('fara escorta') || norm.includes('insoțire') || norm.includes('insoitire'))) {
    const ce216 = articles.find(a => a.abbr === 'CE' && a.number === '216');
    if (ce216 && !results.some(r => r.abbr === 'CE' && r.number === '216')) {
      results.push(ce216);
    }
  }

  // 7. Cross-reference: Clasificarea infracțiunilor (Art. 16 CP)
  // Needed whenever an offense penalty, escort, classification, or early release is questioned
  if (
    isAllowed('CP') &&
    (norm.includes('clasific') || 
    norm.includes('grava') || 
    norm.includes('deosebit de') || 
    norm.includes('categorie') || 
    norm.includes('gravitate') ||
    (results.some(r => r.abbr === 'CP') && (norm.includes('escorta') || norm.includes('liberare') || norm.includes('inlocuire') || norm.includes('termen'))))
  ) {
    const cp16 = articles.find(a => a.abbr === 'CP' && a.number === '16');
    if (cp16 && !results.some(r => r.abbr === 'CP' && r.number === '16')) {
      results.push(cp16);
    }
  }

  // 8. Cross-reference: Liberare condiționată (Art. 91 CP + Art. 266-267 CE)
  if (isAllowed('CP') && (norm.includes('liberare conditionata') || norm.includes('art. 91') || norm.includes('articolul 91'))) {
    const cp91 = articles.find(a => a.abbr === 'CP' && a.number === '91');
    if (cp91 && !results.some(r => r.abbr === 'CP' && r.number === '91')) results.push(cp91);
    if (isAllowed('CE')) {
      const ce266 = articles.find(a => a.abbr === 'CE' && a.number === '266');
      if (ce266 && !results.some(r => r.abbr === 'CE' && r.number === '266')) results.push(ce266);
    }
  }

  // 9. Cross-reference: Deținerea separată (Art. 205 CE)
  if (isAllowed('CE') && (norm.includes('separat') || norm.includes('detinere separata') || norm.includes('art. 205') || norm.includes('articolul 205'))) {
    const ce205 = articles.find(a => a.abbr === 'CE' && a.number === '205');
    if (ce205 && !results.some(r => r.abbr === 'CE' && r.number === '205')) results.push(ce205);
  }

  // 10. Automatic semantic keyword discovery fallback if few or no articles matched
  if (results.length < 3) {
    const keywordMatches = searchArticlesByKeywords(prompt, 5, allowedAbbrs);
    for (const km of keywordMatches) {
      if (!results.some(r => r.abbr === km.abbr && r.number === km.number)) {
        results.push(km);
      }
      if (results.length >= 4) break;
    }
  }

  return results;
}

/**
 * Search articles by keywords if no specific article number was matched
 */
export function searchArticlesByKeywords(query: string, maxResults: number = 3, allowedAbbrs?: ('CP' | 'CE' | 'CPP' | 'CC')[]): LegalArticle[] {
  const normQuery = normalizeText(query);
  const words = normQuery.split(' ').filter(w => w.length >= 4);
  if (words.length === 0) return [];

  const allArticles = getLegislationArticles();
  const articles = allowedAbbrs && allowedAbbrs.length > 0
    ? allArticles.filter(a => allowedAbbrs.includes(a.abbr))
    : allArticles;

  const scored = articles.map(art => {
    const normTitle = normalizeText(art.title);
    const normText = normalizeText(art.text);
    let score = 0;

    for (const w of words) {
      if (normTitle.includes(w)) score += 12;
      if (normText.includes(w)) {
        score += 2;
        // bonus if multiple occurrences
        const count = (normText.match(new RegExp('\\b' + w, 'g')) || []).length;
        score += Math.min(count, 5);
      }
    }

    // Key phrase bonus
    if (normQuery.includes('arest contraventional') && (normText.includes('arest') && normText.includes('contravent'))) {
      score += 10;
    }
    if (normQuery.includes('incheieri') && normText.includes('hotarari')) {
      score += 5;
    }
    if (normQuery.includes('aceasi persoana') && normText.includes('aceeasi persoana')) {
      score += 15;
    }

    return { art, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.art);
}

/**
 * Formats a legal article into clean, elegant Markdown with structured paragraphs,
 * bold sub-items, and emphasized key legal terms.
 */
export function formatLegalArticle(art: LegalArticle): string {
  const lines = art.text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const paras: { num: string; rawText: string }[] = [];
  let currentPara: { num: string; rawText: string } | null = null;

  for (const line of lines) {
    if (line.startsWith('Articolul ') && line.includes('.')) continue;
    if (/^\[Art\./i.test(line)) continue;
    if (/^în vârstă de până/i.test(line)) continue;
    if (/^cu o pedeapsă mai blândă/i.test(line)) continue;
    if (/^înainte de termen/i.test(line)) continue;

    const matchAlin = line.match(/^\(([0-9]+(?:\^?[0-9]*)?)\)\s*(.*)/);
    if (matchAlin) {
      if (currentPara) paras.push(currentPara);
      currentPara = { num: matchAlin[1], rawText: matchAlin[2] };
    } else if (currentPara) {
      currentPara.rawText += ' ' + line;
    } else {
      currentPara = { num: '', rawText: line };
    }
  }
  if (currentPara) paras.push(currentPara);

  let out = `### ⚖️ Articolul ${art.number}. ${art.title}\n`;
  out += `> **${art.code}**\n\n`;

  for (const p of paras) {
    let t = p.rawText.trim();
    
    // In contraventional context, clean extraneous secondary penal procedure pointer from Art 312
    if (art.abbr === 'CE' && art.number === '312') {
      t = t.replace(/,\s*cu darea în consemn potrivit Codului de procedură penală[^\.]*/gi, '');
    }
    
    // Emphasize fractions and critical limits
    t = t.replace(/\b(cel puţin o treime|cel puţin jumătate|cel puţin două treimi|cel puțin 1\/2|cel puțin 2\/3|cel puțin 1\/3)\b/gi, '**$1**');
    t = t.replace(/\b(8 ani|5 ani|30 de ani|90 de zile|10 ani|21 de ani|18 ani|60 de ani|3 ani|1 an)\b/gi, '**$1**');
    t = t.replace(/\b(infracţiune uşoară|infracţiuni uşoare|infracţiune mai puţin gravă|infracţiuni mai puţin grave|infracţiune gravă|infracţiuni grave|deosebit de grave|excepţional de grave)\b/gi, '**$1**');

    // Format sub-items a), b), c)... into neat bullet points
    if (t.includes('a)') && t.includes('b)')) {
      const parts = t.split(/(?=\b[a-z]\)\s*)/);
      const header = parts[0].trim();
      const items = parts.slice(1);

      if (p.num) {
        out += `**(${p.num})** ${header}\n`;
      } else {
        out += `${header}\n`;
      }
      for (const it of items) {
        const itemMatch = it.match(/^([a-z]\))\s*(.*)/);
        if (itemMatch) {
          out += `* **${itemMatch[1]}** ${itemMatch[2].trim()}\n`;
        } else {
          out += `* ${it.trim()}\n`;
        }
      }
      out += '\n';
    } else {
      if (p.num) {
        out += `**(${p.num})** ${t}\n\n`;
      } else {
        out += `${t}\n\n`;
      }
    }
  }

  out += '---\n✅ *Dispoziții oficiale consolidate conform legislației Republicii Moldova.*';
  return out;
}

