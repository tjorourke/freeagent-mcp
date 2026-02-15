import { extractId, parseNumericString } from '../utils/validators.js';

export { extractId, parseNumericString };

/**
 * Normalize status strings from the FreeAgent API to consistent Title Case.
 * The API returns lowercase statuses (e.g., "active", "overdue") but our
 * LLM types and tool logic expect capitalized forms (e.g., "Active", "Overdue").
 */
export function capitalizeStatus(status: string): string {
  return status.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function computeDaysOverdue(dueDate: string, status: string): number | undefined {
  if (capitalizeStatus(status) !== 'Overdue') {
    return undefined;
  }

  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : undefined;
}

export function computeFullName(firstName?: string, lastName?: string, organisationName?: string): string {
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ');
  }
  return organisationName ?? 'Unknown';
}

export function parseDate(dateString: string | undefined | null): string | undefined {
  if (!dateString) {
    return undefined;
  }
  // FreeAgent dates are already in YYYY-MM-DD format
  return dateString;
}

export function computeLineTotal(quantity: string, price: string): number {
  const qty = parseNumericString(quantity);
  const prc = parseNumericString(price);
  return Math.round(qty * prc * 100) / 100;
}
