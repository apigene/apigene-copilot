export interface ApplicationData {
  api_title: string;
  api_name: string;
  api_version: string;
  domain_url: string;
  server_url: string;
  server_url_options: any[];
  examples: any[];
  llm_summary: string | null;
  llm_app_categories: string | null;
  llm_use_cases_content: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  security_info: Record<string, any>;
  security_info_configured: boolean;
  operations_state: any;
  operations_total_count: number;
  operations_enabled_count: number;
  common_parameters: Record<string, any>;
  user_input_templates: any;
  global_spec: boolean;
  agentic_metadata: any[];
}
