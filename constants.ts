import { 
  IncomingMessage, 
  DestinationChannel, 
  ChannelType, 
  ForwardRule,
  RuleDestination,
  DeliveryStatus,
  DeliveryAttempt
} from './types';

const NOW = new Date();


export const CHANNELS: DestinationChannel[] = [
  {
    id: 'c1',
    type: ChannelType.TELEGRAM,
    name: 'گروه فنی انبار',
    is_enabled: true,
    config: { chat_id: '-100234234' }
  },
  {
    id: 'c2',
    type: ChannelType.WEBHOOK,
    name: 'Backend API',
    is_enabled: true,
    config: { url: 'https://api.company.com/hooks/sms' }
  },
  {
    id: 'c3',
    type: ChannelType.EMAIL,
    name: 'مدیر سیستم',
    is_enabled: true,
    config: { email: 'admin@company.com' }
  }
];

export const RULES: ForwardRule[] = [
  {
    id: 'r1',
    name: 'هشدارهای دما (فوری)',
    is_enabled: true,
    filters: { contains: 'ALERT' },
    stop_processing: false
  },
  {
    id: 'r2',
    name: 'لاگ عمومی',
    is_enabled: true,
    filters: {},
    stop_processing: false
  }
];

export const RULE_DESTINATIONS: RuleDestination[] = [
  {
    id: 'rd1',
    rule_id: 'r1',
    channel_id: 'c1', // Send Alerts to Telegram
    is_enabled: true,
  },
  {
    id: 'rd2',
    rule_id: 'r1',
    channel_id: 'c2', // Send Alerts to Webhook too
    is_enabled: true,
  },
  {
    id: 'rd3',
    rule_id: 'r2',
    channel_id: 'c2', // Send General Logs to Webhook
    is_enabled: true,
  }
];

// Generate some mock messages
const generateMessages = (): IncomingMessage[] => {
  const msgs: IncomingMessage[] = [];
  for (let i = 0; i < 25; i++) {
    const isAlert = Math.random() > 0.8;
    msgs.push({
      id: `m${i}`,
      from_number: `+98912${Math.floor(1000000 + Math.random() * 9000000)}`,
      to_number: '+989120001122',
      body: isAlert ? 'ALERT: Temperature exceeded 45C in Zone 2' : `Status Report: All systems nominal. Cycle: ${i}`,
      received_at: new Date(NOW.getTime() - 1000 * 60 * 60 * i * 0.5).toISOString(),
      processed: true,
      raw_payload: { signal: -70, voltage: 3.7 }
    });
  }
  return msgs;
};

export const MESSAGES = generateMessages();

// Generate Delivery Attempts based on Messages and Rules
const generateDeliveryAttempts = (): DeliveryAttempt[] => {
  const attempts: DeliveryAttempt[] = [];
  // Let's attach logs to the first few messages
  MESSAGES.slice(0, 5).forEach((msg) => {
    // Simulate r1 (Alert) matching
    if (msg.body.includes('ALERT')) {
       attempts.push({
         id: `da-${msg.id}-1`,
         message_id: msg.id,
         rule_id: 'r1',
         channel_id: 'c1', // Telegram
         status: DeliveryStatus.SENT,
         provider_message_id: 'tg_msg_123',
         error: '',
         last_attempt_at: new Date(new Date(msg.received_at).getTime() + 2000).toISOString(),
         retry_count: 0
       });
       attempts.push({
         id: `da-${msg.id}-2`,
         message_id: msg.id,
         rule_id: 'r1',
         channel_id: 'c2', // Webhook
         status: DeliveryStatus.FAILED,
         provider_message_id: '',
         error: 'Timeout: 5000ms exceeded',
         last_attempt_at: new Date(new Date(msg.received_at).getTime() + 2000).toISOString(),
         retry_count: 3
       });
    } else {
       // General Log (r2)
       attempts.push({
         id: `da-${msg.id}-3`,
         message_id: msg.id,
         rule_id: 'r2',
         channel_id: 'c2', // Webhook
         status: DeliveryStatus.SENT,
         provider_message_id: 'wh_req_999',
         error: '',
         last_attempt_at: new Date(new Date(msg.received_at).getTime() + 1000).toISOString(),
         retry_count: 0
       });
    }
  });
  return attempts;
};

export const DELIVERY_ATTEMPTS = generateDeliveryAttempts();

export const STATS_DATA = [
  { name: '00:00', sms: 12 },
  { name: '04:00', sms: 5 },
  { name: '08:00', sms: 45 },
  { name: '12:00', sms: 120 },
  { name: '16:00', sms: 85 },
  { name: '20:00', sms: 60 },
  { name: '23:59', sms: 30 },
];