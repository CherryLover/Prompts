export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  models?: string[];
  favorite: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface User {
  id: string;
  email?: string;
} 