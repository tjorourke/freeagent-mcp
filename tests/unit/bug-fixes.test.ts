import { describe, it, expect } from 'vitest';
import { capitalizeStatus, computeDaysOverdue } from '../../src/transformers/common.js';
import { transformBankAccount, transformBankAccounts } from '../../src/transformers/bank-transformer.js';
import { transformInvoice } from '../../src/transformers/invoice-transformer.js';
import { transformBill } from '../../src/transformers/bill-transformer.js';
import { transformContact } from '../../src/transformers/contact-transformer.js';
import { transformProject, transformTask, transformTimeslip } from '../../src/transformers/project-transformer.js';
import { transformExpense } from '../../src/transformers/expense-transformer.js';
import type {
  FreeAgentBankAccount,
  FreeAgentInvoice,
  FreeAgentBill,
  FreeAgentContact,
  FreeAgentProject,
  FreeAgentTask,
  FreeAgentTimeslip,
  FreeAgentExpense,
} from '../../src/types/freeagent/index.js';

// ============================================================
// capitalizeStatus normalizes API lowercase statuses
// ============================================================
describe('capitalizeStatus', () => {
  it('capitalizes single lowercase words', () => {
    expect(capitalizeStatus('active')).toBe('Active');
    expect(capitalizeStatus('open')).toBe('Open');
    expect(capitalizeStatus('overdue')).toBe('Overdue');
    expect(capitalizeStatus('paid')).toBe('Paid');
    expect(capitalizeStatus('draft')).toBe('Draft');
    expect(capitalizeStatus('hidden')).toBe('Hidden');
  });

  it('is idempotent for already-capitalized values', () => {
    expect(capitalizeStatus('Active')).toBe('Active');
    expect(capitalizeStatus('Open')).toBe('Open');
    expect(capitalizeStatus('Overdue')).toBe('Overdue');
  });

  it('handles hyphenated statuses', () => {
    expect(capitalizeStatus('non-billable')).toBe('Non-Billable');
    expect(capitalizeStatus('non-reimbursed')).toBe('Non-Reimbursed');
  });

  it('handles multi-word statuses', () => {
    expect(capitalizeStatus('thank you')).toBe('Thank You');
    expect(capitalizeStatus('pending approval')).toBe('Pending Approval');
  });
});

// ============================================================
// Transformers normalize lowercase API statuses
// ============================================================
describe('Transformer status normalization', () => {
  describe('bank account transformer', () => {
    const baseBankAccount: FreeAgentBankAccount = {
      url: 'https://api.freeagent.com/v2/bank_accounts/123',
      name: 'Business Account',
      type: 'StandardBankAccount',
      currency: 'GBP',
      current_balance: '1000.00',
      opening_balance: '0.00',
      // Real API returns lowercase
      status: 'active' as FreeAgentBankAccount['status'],
      is_primary: true,
      latest_activity_date: '2024-01-15',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    };

    it('normalizes lowercase status to Active', () => {
      const result = transformBankAccount(baseBankAccount);
      expect(result.status).toBe('Active');
    });

    it('preserves already-capitalized status', () => {
      const account = { ...baseBankAccount, status: 'Active' as FreeAgentBankAccount['status'] };
      const result = transformBankAccount(account);
      expect(result.status).toBe('Active');
    });

    it('normalizes status in batch transform', () => {
      const accounts = [
        baseBankAccount,
        { ...baseBankAccount, url: 'https://api.freeagent.com/v2/bank_accounts/456', status: 'inactive' as FreeAgentBankAccount['status'] },
      ];
      const results = transformBankAccounts(accounts);
      expect(results[0]!.status).toBe('Active');
      expect(results[1]!.status).toBe('Inactive');
    });
  });

  describe('invoice transformer', () => {
    const baseInvoice: FreeAgentInvoice = {
      url: 'https://api.freeagent.com/v2/invoices/789',
      contact: 'https://api.freeagent.com/v2/contacts/123',
      dated_on: '2024-01-15',
      due_on: '2024-02-14',
      reference: 'INV-001',
      currency: 'GBP',
      net_value: '1000.00',
      sales_tax_value: '200.00',
      total_value: '1200.00',
      paid_value: '0.00',
      due_value: '1200.00',
      status: 'open' as FreeAgentInvoice['status'],
      payment_terms_in_days: 30,
      invoice_items: [{ description: 'Work', item_type: 'Hours', quantity: '10', price: '100.00' }],
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      involves_sales_tax: true,
      always_show_bic_and_iban: false,
      send_thank_you_emails: false,
      send_reminder_emails: true,
      send_new_invoice_emails: true,
    };

    it('normalizes lowercase open status', () => {
      const result = transformInvoice(baseInvoice);
      expect(result.status).toBe('Open');
    });

    it('normalizes lowercase overdue status', () => {
      const invoice = { ...baseInvoice, status: 'overdue' as FreeAgentInvoice['status'] };
      const result = transformInvoice(invoice);
      expect(result.status).toBe('Overdue');
    });
  });

  describe('bill transformer', () => {
    it('normalizes lowercase status', () => {
      const bill: FreeAgentBill = {
        url: 'https://api.freeagent.com/v2/bills/100',
        contact: 'https://api.freeagent.com/v2/contacts/123',
        reference: 'BILL-001',
        dated_on: '2024-01-15',
        due_on: '2024-02-14',
        currency: 'GBP',
        total_value: '500.00',
        sales_tax_value: '100.00',
        paid_value: '0.00',
        due_value: '500.00',
        status: 'open' as FreeAgentBill['status'],
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };
      const result = transformBill(bill);
      expect(result.status).toBe('Open');
    });
  });

  describe('contact transformer', () => {
    it('normalizes lowercase status', () => {
      const contact: FreeAgentContact = {
        url: 'https://api.freeagent.com/v2/contacts/123',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        account_balance: '0.00',
        status: 'active' as FreeAgentContact['status'],
        active_projects_count: 0,
        contact_name_on_invoices: true,
        uses_contact_invoice_sequence: false,
        charge_sales_tax: 'Auto',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      const result = transformContact(contact);
      expect(result.status).toBe('Active');
    });
  });

  describe('project transformer', () => {
    it('normalizes lowercase project status', () => {
      const project: FreeAgentProject = {
        url: 'https://api.freeagent.com/v2/projects/100',
        contact: 'https://api.freeagent.com/v2/contacts/123',
        name: 'Test Project',
        status: 'active' as FreeAgentProject['status'],
        currency: 'GBP',
        budget: '10000.00',
        budget_units: 'Hours',
        is_ir35: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      const result = transformProject(project);
      expect(result.status).toBe('Active');
    });

    it('normalizes lowercase task status', () => {
      const task: FreeAgentTask = {
        url: 'https://api.freeagent.com/v2/tasks/50',
        project: 'https://api.freeagent.com/v2/projects/100',
        name: 'Test Task',
        status: 'active' as FreeAgentTask['status'],
        is_billable: true,
      };
      const result = transformTask(task);
      expect(result.status).toBe('Active');
    });

    it('normalizes lowercase timeslip status', () => {
      const timeslip: FreeAgentTimeslip = {
        url: 'https://api.freeagent.com/v2/timeslips/200',
        user: 'https://api.freeagent.com/v2/users/1',
        project: 'https://api.freeagent.com/v2/projects/100',
        task: 'https://api.freeagent.com/v2/tasks/50',
        dated_on: '2024-01-15',
        hours: '8.0',
        status: 'unbilled' as FreeAgentTimeslip['status'],
      };
      const result = transformTimeslip(timeslip);
      expect(result.status).toBe('Unbilled');
    });
  });

  describe('expense transformer', () => {
    it('normalizes lowercase status', () => {
      const expense: FreeAgentExpense = {
        url: 'https://api.freeagent.com/v2/expenses/300',
        user: 'https://api.freeagent.com/v2/users/1',
        category: 'https://api.freeagent.com/v2/categories/100',
        dated_on: '2024-01-15',
        currency: 'GBP',
        gross_value: '50.00',
        description: 'Office supplies',
        status: 'non-reimbursed' as FreeAgentExpense['status'],
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };
      const result = transformExpense(expense);
      expect(result.status).toBe('Non-Reimbursed');
    });
  });
});

describe('computeDaysOverdue with lowercase status', () => {
  it('handles lowercase overdue status from API', () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const dueDate = fiveDaysAgo.toISOString().split('T')[0]!;

    const result = computeDaysOverdue(dueDate, 'overdue');
    expect(result).toBe(5);
  });

  it('returns undefined for lowercase non-overdue statuses', () => {
    expect(computeDaysOverdue('2024-01-01', 'open')).toBeUndefined();
    expect(computeDaysOverdue('2024-01-01', 'paid')).toBeUndefined();
  });
});
