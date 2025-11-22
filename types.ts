export enum Environment {
  PROD = "prod",
  STAGE = "stage",
  DEV = "dev"
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  environment: Environment;
  description: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SimEndpoint {
  id: string;
  project_id: string;
  name: string;
  phone_number: string;
  imei: string;
  api_token: string;
  is_active: boolean;
  last_heartbeat?: string;
  signal_strength?: number;
}

export interface IncomingMessage {
  id: string;
  project_id: string;
  endpoint_id: string;
  from_number: string;
  to_number: string;
  body: string;
  received_at: string;
  raw_payload: Record<string, any>;
  processed: boolean;
}

export enum ChannelType {
  SMS = "sms",
  TELEGRAM = "telegram",
  WEBHOOK = "webhook",
  EMAIL = "email"
}

export interface DestinationChannel {
  id: string;
  project_id: string;
  type: ChannelType;
  name: string;
  is_enabled: boolean;
  config: Record<string, any>;
}

export interface ForwardRule {
  id: string;
  project_id: string;
  name: string;
  is_enabled: boolean;
  priority: number;
  source_endpoint_id?: string | null;
  filters: Record<string, any>;
  stop_processing: boolean;
}

export interface RuleDestination {
  id: string;
  rule_id: string;
  channel_id: string;
  is_enabled: boolean;
  override_text_template: string;
  action_config: Record<string, any>;
}

export enum DeliveryStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed"
}

export interface DeliveryAttempt {
  id: string;
  message_id: string;
  rule_id: string;
  channel_id: string;
  status: DeliveryStatus;
  provider_message_id: string;
  error: string;
  last_attempt_at?: string;
  retry_count: number;
  // Optional fields from API
  channel_name?: string;
  rule_name?: string;
  message_content?: string;
}