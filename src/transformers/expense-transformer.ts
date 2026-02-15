import type { FreeAgentExpense } from '../types/freeagent/index.js';
import type { LLMExpense } from '../types/llm/index.js';
import { extractId, parseNumericString, capitalizeStatus } from './common.js';

export function transformExpense(expense: FreeAgentExpense): LLMExpense {
  return {
    id: extractId(expense.url),
    userId: extractId(expense.user),
    category: extractId(expense.category),
    datedOn: expense.dated_on,
    currency: expense.currency,
    grossValue: parseNumericString(expense.gross_value),
    salesTaxValue: expense.sales_tax_value ? parseNumericString(expense.sales_tax_value) : undefined,
    description: expense.description,
    projectId: expense.project ? extractId(expense.project) : undefined,
    status: capitalizeStatus(expense.status) as LLMExpense['status'],
  };
}

export function transformExpenses(expenses: FreeAgentExpense[]): LLMExpense[] {
  return expenses.map(transformExpense);
}
