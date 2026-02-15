import type { FreeAgentInvoice, FreeAgentInvoiceItem } from '../types/freeagent/index.js';
import type { LLMInvoice, LLMInvoiceItem } from '../types/llm/index.js';
import { extractId, parseNumericString, computeDaysOverdue, computeLineTotal, capitalizeStatus } from './common.js';

export function transformInvoiceItem(item: FreeAgentInvoiceItem): LLMInvoiceItem {
  return {
    description: item.description ?? '',
    itemType: item.item_type,
    quantity: parseNumericString(item.quantity),
    price: parseNumericString(item.price),
    salesTaxRate: item.sales_tax_rate ? parseNumericString(item.sales_tax_rate) : undefined,
    lineTotal: computeLineTotal(item.quantity, item.price),
  };
}

export function transformInvoice(
  invoice: FreeAgentInvoice,
  contactNameLookup?: Map<string, string>
): LLMInvoice {
  const contactId = extractId(invoice.contact);
  const contactName = contactNameLookup?.get(invoice.contact) ?? contactId;

  return {
    id: extractId(invoice.url),
    reference: invoice.reference,
    contactId,
    contactName,
    projectId: invoice.project ? extractId(invoice.project) : undefined,
    datedOn: invoice.dated_on,
    dueOn: invoice.due_on,
    currency: invoice.currency,
    netValue: parseNumericString(invoice.net_value),
    taxValue: parseNumericString(invoice.sales_tax_value),
    totalValue: parseNumericString(invoice.total_value),
    paidValue: parseNumericString(invoice.paid_value),
    dueValue: parseNumericString(invoice.due_value),
    status: capitalizeStatus(invoice.status) as LLMInvoice['status'],
    daysOverdue: computeDaysOverdue(invoice.due_on, invoice.status),
    items: invoice.invoice_items.map(transformInvoiceItem),
    comments: invoice.comments,
    paymentTermsDays: invoice.payment_terms_in_days,
  };
}

export function transformInvoices(
  invoices: FreeAgentInvoice[],
  contactNameLookup?: Map<string, string>
): LLMInvoice[] {
  return invoices.map((inv) => transformInvoice(inv, contactNameLookup));
}
