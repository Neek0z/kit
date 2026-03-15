import { supabase } from "./supabase";
import {
  scheduleFollowUpNotification,
  cancelNotification,
} from "./notifications";
import type { WorkflowStep, WorkflowTask } from "../types";

export async function triggerClientWorkflow(
  userId: string,
  contactId: string,
  contactName: string
): Promise<void> {
  const { data: steps, error } = await supabase
    .from("workflow_steps")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !steps || steps.length === 0) {
    console.warn("Aucune étape de workflow trouvée.");
    return;
  }

  const { data: existing } = await supabase
    .from("workflow_tasks")
    .select("id")
    .eq("contact_id", contactId)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log("Workflow déjà en cours pour ce contact.");
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
    };
  });

  const { data: insertedTasks, error: insertError } = await supabase
    .from("workflow_tasks")
    .insert(tasksToInsert)
    .select();

  if (insertError || !insertedTasks) {
    console.error("Erreur création workflow tasks:", insertError);
    return;
  }

  for (const task of insertedTasks as WorkflowTask[]) {
    const dueDate = new Date(task.due_date);
    if (dueDate > now) {
      try {
        const notifId = await scheduleFollowUpNotification(
          `${contactName} — ${task.title}`,
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

