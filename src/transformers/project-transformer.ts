import type { FreeAgentProject, FreeAgentTask, FreeAgentTimeslip } from '../types/freeagent/index.js';
import type { LLMProject, LLMTask, LLMTimeslip } from '../types/llm/index.js';
import { extractId, parseNumericString, capitalizeStatus } from './common.js';

export function transformProject(
  project: FreeAgentProject,
  contactNameLookup?: Map<string, string>
): LLMProject {
  const contactId = extractId(project.contact);
  const contactName = contactNameLookup?.get(project.contact) ?? contactId;

  return {
    id: extractId(project.url),
    name: project.name,
    contactId,
    contactName,
    status: capitalizeStatus(project.status) as LLMProject['status'],
    currency: project.currency,
    budget: parseNumericString(project.budget),
    budgetUnits: project.budget_units,
    billingRate: project.normal_billing_rate ? parseNumericString(project.normal_billing_rate) : undefined,
    isIR35: project.is_ir35,
    startsOn: project.starts_on,
    endsOn: project.ends_on,
  };
}

export function transformProjects(
  projects: FreeAgentProject[],
  contactNameLookup?: Map<string, string>
): LLMProject[] {
  return projects.map((p) => transformProject(p, contactNameLookup));
}

export function transformTask(task: FreeAgentTask): LLMTask {
  return {
    id: extractId(task.url),
    projectId: extractId(task.project),
    name: task.name,
    status: capitalizeStatus(task.status) as LLMTask['status'],
    isBillable: task.is_billable,
    billingRate: task.billing_rate ? parseNumericString(task.billing_rate) : undefined,
    budget: task.budget ? parseNumericString(task.budget) : undefined,
  };
}

export function transformTasks(tasks: FreeAgentTask[]): LLMTask[] {
  return tasks.map(transformTask);
}

export function transformTimeslip(timeslip: FreeAgentTimeslip): LLMTimeslip {
  return {
    id: extractId(timeslip.url),
    userId: extractId(timeslip.user),
    projectId: extractId(timeslip.project),
    taskId: extractId(timeslip.task),
    datedOn: timeslip.dated_on,
    hours: parseNumericString(timeslip.hours),
    comment: timeslip.comment,
    status: capitalizeStatus(timeslip.status) as LLMTimeslip['status'],
    billedOnInvoiceId: timeslip.billed_on_invoice ? extractId(timeslip.billed_on_invoice) : undefined,
  };
}

export function transformTimeslips(timeslips: FreeAgentTimeslip[]): LLMTimeslip[] {
  return timeslips.map(transformTimeslip);
}
