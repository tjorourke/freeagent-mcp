import type { FreeAgentBill, FreeAgentBillItem } from '../types/freeagent/index.js';
import type { LLMBill, LLMBillItem } from '../types/llm/index.js';
import { extractId, parseNumericString, capitalizeStatus } from './common.js';

export function transformBillItem(item: FreeAgentBillItem): LLMBillItem {
  return {
    category: extractId(item.category),
    description: item.description,
    totalValue: parseNumericString(item.total_value),
    salesTaxRate: item.sales_tax_rate ? parseNumericString(item.sales_tax_rate) : undefined,
    projectId: item.project ? extractId(item.project) : undefined,
  };
}

export function transformBill(
  bill: FreeAgentBill,
  contactNameLookup?: Map<string, string>
): LLMBill {
  const contactId = extractId(bill.contact);
  const contactName = contactNameLookup?.get(bill.contact) ?? contactId;

  return {
    id: extractId(bill.url),
    contactId,
    contactName,
    reference: bill.reference,
    datedOn: bill.dated_on,
    dueOn: bill.due_on,
    currency: bill.currency,
    totalValue: parseNumericString(bill.total_value),
    salesTaxValue: parseNumericString(bill.sales_tax_value),
    paidValue: parseNumericString(bill.paid_value),
    dueValue: parseNumericString(bill.due_value),
    status: capitalizeStatus(bill.status) as LLMBill['status'],
    items: bill.bill_items?.map(transformBillItem),
    comments: bill.comments,
  };
}

export function transformBills(
  bills: FreeAgentBill[],
  contactNameLookup?: Map<string, string>
): LLMBill[] {
  return bills.map((bill) => transformBill(bill, contactNameLookup));
}
