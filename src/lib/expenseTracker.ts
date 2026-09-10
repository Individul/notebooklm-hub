export interface ExpenseStats {
  totalCostUSD: number;
  totalCostMDL: number;
  totalTokens: number;
  promptTokens: number;
  candidateTokens: number;
  lastQueryCostUSD: number;
  lastQueryCostMDL: number;
  lastQueryTokens: number;
  queriesCount: number;
}

const STORAGE_KEY = 'notebooklm_gemini_expenses_v1';
export const USD_TO_MDL_RATE = 18.20;

export const INITIAL_EXPENSES: ExpenseStats = {
  totalCostUSD: 0,
  totalCostMDL: 0,
  totalTokens: 0,
  promptTokens: 0,
  candidateTokens: 0,
  lastQueryCostUSD: 0,
  lastQueryCostMDL: 0,
  lastQueryTokens: 0,
  queriesCount: 0,
};

export function calculateCost(
  modelName: string,
  promptTokens: number,
  candidateTokens: number
): { costUSD: number; costMDL: number } {
  const norm = (modelName || '').toLowerCase();
  let inputPricePerM = 1.25; // Default: Gemini 1.5 Pro ($1.25/M input)
  let outputPricePerM = 5.00; // Default: Gemini 1.5 Pro ($5.00/M output)

  if (norm.includes('3.5-flash-lite') || norm.includes('3.1-flash-lite')) {
    inputPricePerM = 0.30;
    outputPricePerM = 2.50;
  } else if (norm.includes('3.5-flash') || norm.includes('3.6-flash') || norm.includes('3.8-flash')) {
    inputPricePerM = 0.35;
    outputPricePerM = 2.00;
  } else if (norm.includes('flash-lite') || norm.includes('lite')) {
    inputPricePerM = 0.075;
    outputPricePerM = 0.30;
  } else if (norm.includes('2.0-flash')) {
    inputPricePerM = 0.10;
    outputPricePerM = 0.40;
  } else if (norm.includes('1.5-flash')) {
    inputPricePerM = 0.075;
    outputPricePerM = 0.30;
  } else if (norm.includes('1.5-pro') || norm.includes('pro')) {
    inputPricePerM = 1.25;
    outputPricePerM = 5.00;
  }

  const costUSD = (promptTokens / 1_000_000) * inputPricePerM + (candidateTokens / 1_000_000) * outputPricePerM;
  const costMDL = costUSD * USD_TO_MDL_RATE;

  return {
    costUSD: Number(costUSD.toFixed(6)),
    costMDL: Number(costMDL.toFixed(4)),
  };
}

export function getStoredExpenses(): ExpenseStats {
  if (typeof window === 'undefined') return INITIAL_EXPENSES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_EXPENSES;
    const parsed = JSON.parse(raw);
    return {
      totalCostUSD: Number(parsed.totalCostUSD) || 0,
      totalCostMDL: Number(parsed.totalCostMDL) || 0,
      totalTokens: Number(parsed.totalTokens) || 0,
      promptTokens: Number(parsed.promptTokens) || 0,
      candidateTokens: Number(parsed.candidateTokens) || 0,
      lastQueryCostUSD: Number(parsed.lastQueryCostUSD) || 0,
      lastQueryCostMDL: Number(parsed.lastQueryCostMDL) || 0,
      lastQueryTokens: Number(parsed.lastQueryTokens) || 0,
      queriesCount: Number(parsed.queriesCount) || 0,
    };
  } catch (err) {
    console.error('Error reading expenses:', err);
    return INITIAL_EXPENSES;
  }
}

export function recordExpense(
  modelName: string,
  promptTokens: number,
  candidateTokens: number
): ExpenseStats {
  const current = getStoredExpenses();
  const { costUSD, costMDL } = calculateCost(modelName, promptTokens, candidateTokens);
  const totalTokens = promptTokens + candidateTokens;

  const updated: ExpenseStats = {
    totalCostUSD: Number((current.totalCostUSD + costUSD).toFixed(6)),
    totalCostMDL: Number((current.totalCostMDL + costMDL).toFixed(4)),
    totalTokens: current.totalTokens + totalTokens,
    promptTokens: current.promptTokens + promptTokens,
    candidateTokens: current.candidateTokens + candidateTokens,
    lastQueryCostUSD: costUSD,
    lastQueryCostMDL: costMDL,
    lastQueryTokens: totalTokens,
    queriesCount: current.queriesCount + 1,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving expenses:', err);
    }
  }

  return updated;
}

export function resetExpenses(): ExpenseStats {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EXPENSES));
    } catch (err) {
      console.error('Error resetting expenses:', err);
    }
  }
  return INITIAL_EXPENSES;
}
