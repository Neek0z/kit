export type UserId = string;
export type ContactId = string;

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
  scheduled_at: string;
  title?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  delay_days: number;
  interaction_type: InteractionType;
  is_active: boolean;
  sort_order: number;
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
  created_at: string;
}

export interface Contact {
  id: ContactId;
  user_id: UserId;
  full_name: string;
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

export type ConversationId = string;
export type MessageId = string;

export interface Conversation {
  id: ConversationId;
  created_at: string;
  updated_at: string;
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
