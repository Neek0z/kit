import { supabase } from "./supabase";
import {
  scheduleFollowUpNotification,
  cancelNotification,
} from "./notifications";
import type { WorkflowRole, WorkflowStep, WorkflowTask } from "../types";

async function insertTasksForRole(
  userId: string,
  contactId: string,
  contactName: string,
  role: WorkflowRole
): Promise<void> {
  const { data: steps, error } = await supabase
    .from("workflow_steps")
    .select("*")
    .eq("user_id", userId)
    .eq("workflow_role", role)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !steps || steps.length === 0) {
    if (error) console.warn(`workflow_steps (${role}):`, error.message);
    return;
  }

  const { data: existing } = await supabase
    .from("workflow_tasks")
    .select("id")
    .eq("contact_id", contactId)
    .eq("workflow_role", role)
    .limit(1);

  if (existing && existing.length > 0) {
    return;
  }

  const now = new Date();
  const tasksToInsert = (steps as WorkflowStep[]).map((step) => {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + step.delay_days);
    dueDate.setHours(9, 0, 0, 0);

    return {
      user_id: userId,
      contact_id: contactId,
      step_id: step.id,
      title: step.name,
      description: step.description,
      interaction_type: step.interaction_type,
      due_date: dueDate.toISOString(),
      workflow_role: role,
    };
  });

  const { data: insertedTasks, error: insertError } = await supabase
    .from("workflow_tasks")
    .insert(tasksToInsert)
    .select();

  if (insertError || !insertedTasks) {
    console.error(`Erreur création workflow_tasks (${role}):`, insertError);
    return;
  }

  const label =
    role === "parrain" ? contactName : `${contactName} — arrivée client`;

  for (const task of insertedTasks as WorkflowTask[]) {
    const dueDate = new Date(task.due_date);
    if (dueDate > now) {
      try {
        const notifId = await scheduleFollowUpNotification(
          `${label} — ${task.title}`,
          contactId,
          dueDate
        );

        await supabase
          .from("workflow_tasks")
          .update({ notification_id: notifId })
          .eq("id", task.id);
      } catch (e) {
        console.warn("Notification non planifiée:", e);
      }
    }
  }
}

/** Accompagnement parrain (relances / actions à faire pour toi). */
export async function triggerParrainWorkflow(
  userId: string,
  contactId: string,
  contactName: string
): Promise<void> {
  await insertTasksForRole(userId, contactId, contactName, "parrain");
}

/** Checklist « côté client » (arrivée, formalités). */
export async function triggerClientArrivalWorkflow(
  userId: string,
  contactId: string,
  contactName: string
): Promise<void> {
  await insertTasksForRole(userId, contactId, contactName, "client_arrival");
}

/** @deprecated Utiliser triggerParrainWorkflow */
export async function triggerClientWorkflow(
  userId: string,
  contactId: string,
  contactName: string
): Promise<void> {
  return triggerParrainWorkflow(userId, contactId, contactName);
}

/** Au passage en client : les deux workflows si des étapes actives existent. */
export async function triggerAllClientWorkflows(
  userId: string,
  contactId: string,
  contactName: string
): Promise<void> {
  await triggerParrainWorkflow(userId, contactId, contactName);
  await triggerClientArrivalWorkflow(userId, contactId, contactName);
}

export async function cancelClientWorkflow(
  contactId: string
): Promise<void> {
  const { data: tasks } = await supabase
    .from("workflow_tasks")
    .select("id, notification_id")
    .eq("contact_id", contactId)
    .is("completed_at", null);

  if (!tasks) return;

  for (const task of tasks as WorkflowTask[]) {
    if (task.notification_id) {
      await cancelNotification(task.notification_id);
    }
  }

  await supabase
    .from("workflow_tasks")
    .delete()
    .eq("contact_id", contactId)
    .is("completed_at", null);
}

export async function completeWorkflowTask(taskId: string): Promise<void> {
  await supabase
    .from("workflow_tasks")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", taskId);
}
