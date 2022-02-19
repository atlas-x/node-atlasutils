export interface SlackMember {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  color: string
  real_name: string;
  tz: string;
  tz_label: string;
  tz_offset: string;
  profile: SlackMemberProfile;
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_bot: boolean;
  updated: number;
  is_app_user: boolean;
  has_2fa: boolean;
}

export interface SlackMemberProfile {
  first_name: string;
  last_name: string;
  avatar_hash: string;
  status_text: string;
  status_emoji: string;
  real_name: string;
  display_name: string;
  real_name_normalized: string;
  display_name_normalized: string;
  email: string;
  team: string;
}

export interface SlackUserGroup {
  id: string;
  team_id: string;
  is_usergroup: boolean;
  name: string;
  description: string;
  handle: string;
  is_external: boolean;
  date_create: number;
  date_update: number;
  date_delete: number;
  auto_type: string;
  created_by: string;
  updated_by: string;
  deleted_by: string;
  prefs: {
    channels: any[];
    groups: any[];
  };
  user_count: string;
}