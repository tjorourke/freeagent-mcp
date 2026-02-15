import type { FreeAgentContact } from '../types/freeagent/index.js';
import type { LLMContact } from '../types/llm/index.js';
import { extractId, parseNumericString, computeFullName, capitalizeStatus } from './common.js';

export function transformContact(contact: FreeAgentContact): LLMContact {
  return {
    id: extractId(contact.url),
    name: computeFullName(contact.first_name, contact.last_name, contact.organisation_name),
    organisationName: contact.organisation_name,
    email: contact.email,
    phoneNumber: contact.phone_number,
    accountBalance: parseNumericString(contact.account_balance),
    status: capitalizeStatus(contact.status) as LLMContact['status'],
    activeProjectsCount: contact.active_projects_count,
    paymentTermsDays: contact.default_payment_terms_in_days,
  };
}

export function transformContacts(contacts: FreeAgentContact[]): LLMContact[] {
  return contacts.map(transformContact);
}
