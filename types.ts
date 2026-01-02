
export interface IncomingMessage {
  id: string;
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
  type: ChannelType;
  name: string;
  is_enabled: boolean;
  config: Record<string, any>;
}

export interface ForwardRule {
  id: string;
  name: string;
  is_enabled: boolean;
  filters: Record<string, any>;
  stop_processing: boolean;
}

export interface RuleDestination {
  id: string;
  rule_id: string;
  channel_id: string;
  is_enabled: boolean;
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