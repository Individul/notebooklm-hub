/**
 * Cleans model output by eliminating chain-of-thought scratchpads,
 * English planning notes, and transitional phrases (e.g., "Let's go.###"),
 * while preserving the complete formatted Romanian answer.
 */
export function cleanDisplayReply(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // 1. Remove transition markers like "Let's go." or "Let's go.###"
  text = text.replace(/Let's go\.?\s*/gi, '\n');

  // 2. The real legal answer starts at the final occurrence of the official title "### ⚖️" or "### Articolul"
  const legalTitleMatches = [...text.matchAll(/(?:^|\n|[.\s])(###\s*(?:⚖️|Articolul|Art\.|Codul|Dispoziții|Răspuns)[^\n]*)/gi)];
  if (legalTitleMatches.length > 0) {
    const lastMatch = legalTitleMatches[legalTitleMatches.length - 1];
    const idx = text.lastIndexOf(lastMatch[1]);
    if (idx !== -1) {
      return text.substring(idx).trim();
    }
  }

  // 3. If there is a scratchpad/draft present, take from the last major markdown header
  const hasScratchpad = /(?:User Question|Source Material|Role:|Constraints:|Check against|Self-Correction|Final Polish|Final structure)/i.test(text);
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
