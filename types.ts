
export type ProviderType = '1secmail' | 'mailtm' | 'guerrilla';

export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  downloadUrl?: string; // Specific for Mail.tm
}

export interface EmailAccount {
  address: string;
  token?: string; 
  id?: string;    
  provider: ProviderType;
}

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  timestamp: number;
  body?: string;
  html?: string;
  isRead: boolean;
  attachments?: Attachment[];
}

export interface NormalizedProvider {
  id: ProviderType;
  name: string;
  description: string;
}

export interface AppState {
  account: EmailAccount | null;
  messages: EmailMessage[];
  selectedMessageId: string | null;
  isRefreshing: boolean;
  activeProvider: ProviderType;
  lastError: string | null;
}
