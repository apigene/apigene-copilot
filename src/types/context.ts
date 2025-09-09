export interface ContextData {
  id: string;
  name: string;
  description: string;
  apps: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContextCreateRequest {
  name: string;
  description: string;
  apps: string[];
}
