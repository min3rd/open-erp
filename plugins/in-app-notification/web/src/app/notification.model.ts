export interface NotificationDto {
  id: string;
  recipient_id: string;
  recipient_text: string;
  title: string;
  body?: string | null;
  level: 'INFO' | 'WARN' | 'ERROR';
  read_at?: string | null;
  created_at: string;
}

export interface NotificationSettingsDto {
  id?: string | null;
  display_name?: string | null;
  support_email?: string | null;
  channel_email?: boolean | null;
  channel_in_app?: boolean | null;
  level_min?: string | null;
  updated_at?: string | null;
}

export interface NotificationPreferenceDto {
  id?: string | null;
  user_id: string;
  channel_email: boolean;
  channel_in_app: boolean;
  level_min: 'INFO' | 'WARN' | 'ERROR';
  updated_at?: string | null;
}
