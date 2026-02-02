import { EmailAccount, EmailMessage, ProviderType, Attachment } from '../types';

export interface IEmailProvider {
  getDomains(): Promise<string[]>;
  createAccount(domain: string, customUsername?: string): Promise<EmailAccount>;
  getMessages(account: EmailAccount): Promise<EmailMessage[]>;
  getMessageContent(account: EmailAccount, messageId: string): Promise<Partial<EmailMessage>>;
  deleteMessage(account: EmailAccount, messageId: string): Promise<void>;
  downloadAttachment(account: EmailAccount, messageId: string, attachment: Attachment): Promise<void>;
}

// Helper to determine API URL based on environment
// In production, you should set up Nginx/Vercel rewrites similar to vite.config.ts
const isDev = import.meta.env.DEV;

class OneSecMailProvider implements IEmailProvider {
  // Use local proxy in dev, direct URL in prod (requires backend CORS handling in prod)
  private baseUrl = isDev ? '/api/1secmail/' : 'https://www.1secmail.com/api/v1/';

  async getDomains(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}?action=getDomainsList`);
      if (res.ok) {
        const domains = await res.json();
        if (Array.isArray(domains) && domains.length > 0) return domains;
      }
    } catch (error) {}
    return ['1secmail.com', '1secmail.org', '1secmail.net'];
  }

  async createAccount(domain: string, customUsername?: string): Promise<EmailAccount> {
    const login = customUsername || Math.random().toString(36).substring(2, 11);
    return { address: `${login}@${domain}`, provider: '1secmail' };
  }

  async getMessages(account: EmailAccount): Promise<EmailMessage[]> {
    const [login, domain] = account.address.split('@');
    try {
      const res = await fetch(`${this.baseUrl}?action=getMessages&login=${login}&domain=${domain}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      return data.map((msg: any) => ({
        id: msg.id.toString(),
        from: msg.from,
        subject: msg.subject,
        date: msg.date,
        timestamp: new Date(msg.date).getTime(),
        isRead: false
      }));
    } catch (error) {
      throw error;
    }
  }

  async getMessageContent(account: EmailAccount, messageId: string): Promise<Partial<EmailMessage>> {
    const [login, domain] = account.address.split('@');
    try {
      const res = await fetch(`${this.baseUrl}?action=readMessage&login=${login}&domain=${domain}&id=${messageId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      const attachments: Attachment[] = (data.attachments || []).map((att: any) => ({
        id: att.filename,
        filename: att.filename,
        contentType: att.contentType,
        size: att.size
      }));

      return {
        body: data.textBody,
        html: data.htmlBody,
        attachments
      };
    } catch (error) {
      throw new Error("Could not fetch message content.");
    }
  }

  async downloadAttachment(account: EmailAccount, messageId: string, attachment: Attachment): Promise<void> {
    const [login, domain] = account.address.split('@');
    const url = `${this.baseUrl}?action=downloadAttachment&login=${login}&domain=${domain}&id=${messageId}&file=${attachment.filename}`;
    window.open(url, '_blank');
  }

  async deleteMessage(): Promise<void> {}
}

class MailTmProvider implements IEmailProvider {
  private baseUrl = 'https://api.mail.tm';

  async getDomains(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/domains`);
      if (res.ok) {
        const data = await res.json();
        return data['hydra:member'].map((d: any) => d.domain);
      }
    } catch (error) {}
    return ['mail.tm']; 
  }

  async createAccount(domain: string, customUsername?: string): Promise<EmailAccount> {
    const login = customUsername || Math.random().toString(36).substring(2, 12);
    const address = `${login}@${domain}`;
    
    // SECURITY FIX: Generate a strong random password for every account
    // This prevents unauthorized access via known hardcoded credentials
    const password = Array(16).fill(0).map(() => Math.random().toString(36).charAt(2)).join('') + '!Aa1';

    const createRes = await fetch(`${this.baseUrl}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    
    if (!createRes.ok) {
      const errData = await createRes.json();
      throw new Error(errData.detail || "Username taken or creation failed.");
    }
    
    const accountData = await createRes.json();
    const tokenRes = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    
    const tokenData = await tokenRes.json();
    return { address, token: tokenData.token, id: accountData.id, provider: 'mailtm' };
  }

  async getMessages(account: EmailAccount): Promise<EmailMessage[]> {
    if (!account.token) return [];
    try {
      const res = await fetch(`${this.baseUrl}/messages`, {
        headers: { 'Authorization': `Bearer ${account.token}` }
      });
      const data = await res.json();
      return data['hydra:member'].map((msg: any) => ({
        id: msg.id,
        from: msg.from.address,
        subject: msg.subject,
        date: new Date(msg.createdAt).toLocaleString(),
        timestamp: new Date(msg.createdAt).getTime(),
        isRead: msg.seen
      }));
    } catch (error) { return []; }
  }

  async getMessageContent(account: EmailAccount, messageId: string): Promise<Partial<EmailMessage>> {
    if (!account.token) return {};
    const res = await fetch(`${this.baseUrl}/messages/${messageId}`, {
      headers: { 'Authorization': `Bearer ${account.token}` }
    });
    const data = await res.json();
    
    const attachments: Attachment[] = (data.attachments || []).map((att: any) => ({
      id: att.id,
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
      downloadUrl: `${this.baseUrl}${att.downloadUrl}`
    }));

    return {
      body: data.text,
      html: data.html.join(''),
      attachments
    };
  }

  async downloadAttachment(account: EmailAccount, _messageId: string, attachment: Attachment): Promise<void> {
    if (!attachment.downloadUrl || !account.token) return;
    const res = await fetch(attachment.downloadUrl, {
      headers: { 'Authorization': `Bearer ${account.token}` }
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async deleteMessage(account: EmailAccount, messageId: string): Promise<void> {
    if (!account.token) return;
    await fetch(`${this.baseUrl}/messages/${messageId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${account.token}` }
    });
  }
}

class GuerrillaMailProvider implements IEmailProvider {
  // Use local proxy in dev
  private baseUrl = isDev ? '/api/guerrilla' : 'https://api.guerrillamail.com/ajax.php';

  async getDomains(): Promise<string[]> { return ['guerrillamail.com']; }
  async createAccount(): Promise<EmailAccount> {
    const res = await fetch(`${this.baseUrl}?f=get_email_address`);
    const data = await res.json();
    return { address: data.email_addr, token: data.sid_token, provider: 'guerrilla' };
  }
  async getMessages(account: EmailAccount): Promise<EmailMessage[]> {
    if (!account.token) return [];
    const res = await fetch(`${this.baseUrl}?f=check_email&seq=0&sid_token=${account.token}`);
    const data = await res.json();
    return (data.list || []).map((msg: any) => ({
      id: msg.mail_id,
      from: msg.mail_from,
      subject: msg.mail_subject,
      date: new Date(parseInt(msg.mail_timestamp) * 1000).toLocaleString(),
      timestamp: parseInt(msg.mail_timestamp) * 1000,
      isRead: msg.mail_read === '1'
    }));
  }
  async getMessageContent(account: EmailAccount, messageId: string): Promise<Partial<EmailMessage>> {
    const res = await fetch(`${this.baseUrl}?f=fetch_email&email_id=${messageId}&sid_token=${account.token}`);
    const data = await res.json();
    return { body: data.mail_body, html: data.mail_body };
  }
  async downloadAttachment(): Promise<void> {}
  async deleteMessage(account: EmailAccount, messageId: string): Promise<void> {
    await fetch(`${this.baseUrl}?f=del_email&email_ids[]=${messageId}&sid_token=${account.token}`);
  }
}

export class EmailServiceProvider {
  private static providers: Record<ProviderType, IEmailProvider> = {
    '1secmail': new OneSecMailProvider(),
    'mailtm': new MailTmProvider(),
    'guerrilla': new GuerrillaMailProvider()
  };
  static getProvider(type: ProviderType): IEmailProvider { return this.providers[type]; }
}