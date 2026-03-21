import type { Feather } from "@expo/vector-icons";

export type UserId = string;
export type ContactId = string;

export type FeatherIconName = keyof typeof Feather.glyphMap;

export type AppRoute =
  | "/(app)/contacts"
  | "/(app)/contacts/new"
  | "/(app)/messages"
  | "/(app)/subscription"
  | "/(app)/content"
  | "/(app)/groups"
  | "/(app)/calendar"
  | "/(app)/profile/edit"
  | "/(app)/profile/export"
  | "/(app)/profile/notifications"
  | "/(app)/profile/workflow"
  | "/(app)/profile/workflow-client"
  | `/(app)/contacts/${string}`
  | `/(app)/contacts/${string}/edit`
  | `/(app)/messages/${string}`
  | `/(app)/groups/${string}`;

export interface UserProfile {
  id: UserId;
  email: string;
  full_name?: string;
  avatar_url?: string;
  expo_push_token?: string | null;
  created_at: string;
  updated_at: string;
}

export type FollowUpRecurrence = "none" | "weekly" | "biweekly" | "monthly";

export const FOLLOW_UP_RECURRENCE_LABELS: Record<FollowUpRecurrence, string> = {
  none: "Aucune",
  weekly: "Toutes les semaines",
  biweekly: "Toutes les 2 semaines",
  monthly: "Tous les mois",
};

export type PipelineStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "client"
  | "inactive";

export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  interested: "Intéressé",
  follow_up: "À relancer",
  client: "Client",
  inactive: "Inactif",
};

export type InteractionType =
  | "call"
  | "message"
  | "email"
  | "meeting"
  | "note";

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  call: "Appel",
  message: "Message",
  email: "Email",
  meeting: "Rencontre",
  note: "Note",
};

export const INTERACTION_ICONS: Record<InteractionType, string> = {
  call: "phone",
  message: "message-circle",
  email: "mail",
  meeting: "users",
  note: "file-text",
};

export interface Interaction {
  id: string;
  user_id: string;
  contact_id: string;
  type: InteractionType;
  content?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  contact_id: string;
  /** All participant contact IDs (includes contact_id for backward compat) */
  contact_ids: string[];
  scheduled_at: string;
  title?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/** Parrain = ton accompagnement ; client_arrival = checklist « côté client » (arrivée). */
export type WorkflowRole = "parrain" | "client_arrival";

export interface WorkflowStep {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  delay_days: number;
  interaction_type: InteractionType;
  is_active: boolean;
  sort_order: number;
  /** Présent après migration SQL `workflow_roles_parrain_client.sql` ; défaut logique `parrain`. */
  workflow_role?: WorkflowRole;
  created_at: string;
}

export interface WorkflowTask {
  id: string;
  user_id: string;
  contact_id: string;
  step_id?: string;
  title: string;
  description?: string;
  interaction_type: InteractionType;
  due_date: string;
  completed_at?: string;
  notification_id?: string;
  /** Aligné sur l’étape source ; défaut logique `parrain`. */
  workflow_role?: WorkflowRole;
  created_at: string;
}

export type GroupType = "contact" | "message";

export interface Group {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  color: string;
  emoji: string;
  type: GroupType;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface ContactGroupMember {
  id: string;
  group_id: string;
  contact_id: string;
  added_at: string;
}

export interface MessageGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}

export const MLM_GROUP_PRESETS = [
  {
    name: "Mon équipe",
    emoji: "🤝",
    color: "#6ee7b7",
    description: "Mes filleuls directs",
  },
  {
    name: "Prospects chauds",
    emoji: "🔥",
    color: "#fbbf24",
    description: "Très intéressés",
  },
  {
    name: "Clients VIP",
    emoji: "⭐",
    color: "#818cf8",
    description: "Meilleurs clients",
  },
  {
    name: "À former",
    emoji: "📚",
    color: "#f87171",
    description: "Nouveaux à accompagner",
  },
] as const;

export interface PromptCategory {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  sort_order: number;
}

export interface Prompt {
  id: string;
  category_id: string;
  title: string;
  prompt_fr: string;
  prompt_en: string;
  tip?: string;
  tool: string;
  sort_order: number;
}

export interface Contact {
  id: ContactId;
  user_id: UserId;
  full_name: string;
  avatar_url?: string | null;
  phone?: string;
  email?: string;
  notes?: string;
  status: PipelineStatus;
  next_follow_up?: string;
  follow_up_recurrence?: FollowUpRecurrence | null;
  last_interaction_at?: string;
  notification_id?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/** Relance planifiée (remplace l’ancien couple tâches + seule next_follow_up). */
export interface ContactRelance {
  id: string;
  user_id: string;
  contact_id: string;
  scheduled_at: string;
  note?: string | null;
  notification_id?: string | null;
  done_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export type ConversationId = string;
export type MessageId = string;

export type ConversationKind = "direct" | "group";

export interface Conversation {
  id: ConversationId;
  created_at: string;
  updated_at: string;
  kind?: ConversationKind;
  /** Groupe de contacts source (messagerie de groupe). */
  source_group_id?: string | null;
  participants?: { user_id: UserId; profile?: UserProfile }[];
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: MessageId;
  conversation_id: ConversationId;
  sender_id: UserId;
  content: string;
  created_at: string;
  read_at: string | null;
}

export type TaskPriority = "low" | "normal" | "high";

export interface ContactTask {
  id: string;
  user_id: string;
  contact_id: string;
  title: string;
  due_date?: string;
  completed_at?: string;
  priority: TaskPriority;
  created_at: string;
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "#64748b",
  normal: "#6ee7b7",
  high: "#f87171",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Faible",
  normal: "Normal",
  high: "Urgent",
};
