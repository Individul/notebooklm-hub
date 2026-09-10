import rmCodesData from './rm-codes.json';

export interface LegalArticle {
  code: string;
  abbr: 'CP' | 'CE' | 'CPP';
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
 * Searches for a specific legal article in RM Codes (CP, CE, CPP) based on user prompt.
 */
export function findArticleByPrompt(prompt: string): LegalArticle | null {
  const norm = normalizeText(prompt);
  const articles = getLegislationArticles();
  
  // Match patterns like: "art. 96", "articolul 92", "art 91", "articol 205", "art. 96^1", "art 96-1"
  const match = prompt.match(/(?:art|articolul|articol)\.?\s*([0-9]+(?:\^?[0-9]*))/i);
  if (!match) return null;
  const num = match[1].replace('-', '^');

  // Determine code preference if specified in prompt
  let preferredAbbr: 'CP' | 'CE' | 'CPP' | null = null;
  if (
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

  // 2. Prioritize Codul Penal (CP) by default, then CE, then CPP
  const cpMatch = articles.find(a => a.abbr === 'CP' && a.number === num);
  if (cpMatch) return cpMatch;

  const ceMatch = articles.find(a => a.abbr === 'CE' && a.number === num);
  if (ceMatch) return ceMatch;

  const cppMatch = articles.find(a => a.abbr === 'CPP' && a.number === num);
  if (cppMatch) return cppMatch;

  return null;
}

/**
 * Discovers all directly mentioned and topic-related articles (e.g. Art. 151 + Art. 16 + Art. 216)
 */
export function findAllRelevantArticles(prompt: string): LegalArticle[] {
  const norm = normalizeText(prompt);
  const articles = getLegislationArticles();
  const results: LegalArticle[] = [];

  // 1. Explicit articles mentioned in prompt
  const artMatches = [...prompt.matchAll(/(?:art|articolul|articol)\.?\s*([0-9]+(?:\^?[0-9]*))/gi)];
  for (const m of artMatches) {
    const num = m[1].replace('-', '^');
    const isCE = norm.includes('executare') || norm.includes('ce rm') || norm.includes('penitenciar');
    const isCPP = norm.includes('procedura') || norm.includes('cpp');
    
    let art: LegalArticle | undefined;
    if (isCE) art = articles.find(a => a.abbr === 'CE' && a.number === num);
    else if (isCPP) art = articles.find(a => a.abbr === 'CPP' && a.number === num);
    else art = articles.find(a => a.abbr === 'CP' && a.number === num);

    if (!art) {
      art = articles.find(a => a.number === num);
    }
    if (art && !results.some(r => r.abbr === art!.abbr && r.number === art!.number)) {
      results.push(art);
    }
  }

  // 2. Cross-reference: Deplasare fără escortă / regim (Art. 216 CE)
  if (norm.includes('escorta') || norm.includes('fara escorta') || norm.includes('insoțire') || norm.includes('insoitire')) {
    const ce216 = articles.find(a => a.abbr === 'CE' && a.number === '216');
    if (ce216 && !results.some(r => r.abbr === 'CE' && r.number === '216')) {
      results.push(ce216);
    }
  }

  // 3. Cross-reference: Clasificarea infracțiunilor (Art. 16 CP)
  // Needed whenever an offense penalty, escort, classification, or early release is questioned
  if (
    norm.includes('clasific') || 
    norm.includes('grava') || 
    norm.includes('deosebit de') || 
    norm.includes('categorie') || 
    norm.includes('gravitate') ||
    (results.some(r => r.abbr === 'CP') && (norm.includes('escorta') || norm.includes('liberare') || norm.includes('inlocuire') || norm.includes('termen')))
  ) {
    const cp16 = articles.find(a => a.abbr === 'CP' && a.number === '16');
    if (cp16 && !results.some(r => r.abbr === 'CP' && r.number === '16')) {
      results.push(cp16);
    }
  }

  // 4. Cross-reference: Liberare condiționată (Art. 91 CP + Art. 266-267 CE)
  if (norm.includes('liberare conditionata') || norm.includes('art. 91') || norm.includes('articolul 91')) {
    const cp91 = articles.find(a => a.abbr === 'CP' && a.number === '91');
    if (cp91 && !results.some(r => r.abbr === 'CP' && r.number === '91')) results.push(cp91);
    const ce266 = articles.find(a => a.abbr === 'CE' && a.number === '266');
    if (ce266 && !results.some(r => r.abbr === 'CE' && r.number === '266')) results.push(ce266);
  }

  // 5. Cross-reference: Deținerea separată (Art. 205 CE)
  if (norm.includes('separat') || norm.includes('detinere separata') || norm.includes('art. 205') || norm.includes('articolul 205')) {
    const ce205 = articles.find(a => a.abbr === 'CE' && a.number === '205');
    if (ce205 && !results.some(r => r.abbr === 'CE' && r.number === '205')) results.push(ce205);
  }

  return results;
}

/**
 * Search articles by keywords if no specific article number was matched
 */
export function searchArticlesByKeywords(query: string, maxResults: number = 3): LegalArticle[] {
  const normQuery = normalizeText(query);
  const words = normQuery.split(' ').filter(w => w.length >= 4);
  if (words.length === 0) return [];

  const articles = getLegislationArticles();
  const scored = articles.map(art => {
    const normTitle = normalizeText(art.title);
    const normText = normalizeText(art.text);
    let score = 0;

    for (const w of words) {
      if (normTitle.includes(w)) score += 10;
      if (normText.includes(w)) score += 1;
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

