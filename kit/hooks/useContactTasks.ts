import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";
import type { ContactTask, TaskPriority } from "../types";

interface CreateTaskInput {
  title: string;
  due_date?: string;
  priority?: TaskPriority;
}

function sortTasks(tasks: ContactTask[]) {
  return [...tasks].sort((a, b) => {
    const aDone = !!a.completed_at;
    const bDone = !!b.completed_at;
    if (aDone !== bDone) return aDone ? 1 : -1; // pending first

    const aDue = a.due_date ? new Date(a.due_date).getTime() : null;
    const bDue = b.due_date ? new Date(b.due_date).getTime() : null;
    if (aDue !== null || bDue !== null) {
      if (aDue === null) return 1; // nulls last
      if (bDue === null) return -1;
      if (aDue !== bDue) return aDue - bDue; // ascending due_date
    }

    const aCreated = new Date(a.created_at).getTime();
    const bCreated = new Date(b.created_at).getTime();
    return bCreated - aCreated; // newest first
  });
}

export function useContactTasks(contactId: string) {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<ContactTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user || !contactId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data } = await supabase
      .from("contact_tasks")
      .select("*")
      .eq("contact_id", contactId)
      .eq("user_id", user.id);

    setTasks(sortTasks((data ?? []) as ContactTask[]));
    setLoading(false);
  }, [contactId, user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (input: CreateTaskInput): Promise<boolean> => {
    if (!user || !contactId) return false;

    const { data, error } = await supabase
      .from("contact_tasks")
      .insert({
        ...input,
        contact_id: contactId,
        user_id: user.id,
        priority: input.priority ?? "normal",
      })
      .select()
      .single();

    if (error || !data) return false;

    setTasks((prev) => sortTasks([data as ContactTask, ...prev]));
    return true;
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    const completed_at = completed ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("contact_tasks")
      .update({ completed_at })
      .eq("id", taskId);

    if (error) return false;

    setTasks((prev) =>
      sortTasks(
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completed_at: completed ? new Date().toISOString() : undefined,
              }
            : t
        )
      )
    );
    return true;
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    const { error } = await supabase.from("contact_tasks").delete().eq("id", taskId);
    if (error) return false;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    return true;
  };

  const pendingTasks = useMemo(
    () => tasks.filter((t) => !t.completed_at),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((t) => !!t.completed_at),
    [tasks]
  );
  const pendingCount = pendingTasks.length;

  return {
    tasks,
    pendingTasks,
    completedTasks,
    pendingCount,
    loading,
    createTask,
    toggleTask,
    deleteTask,
    refetch: fetchTasks,
  };
}

