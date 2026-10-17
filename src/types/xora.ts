/**
 * Xora AI System Types & Interfaces
 */

export type XoraRole = 'user' | 'assistant' | 'system';

export type XoraActionType =
  | 'navigate_internal'
  | 'open_external_link'
  | 'copy_text'
  | 'open_help_article'
  | 'open_product'
  | 'open_user_library'
  | 'open_wallet'
  | 'open_referrals'
  | 'open_support';

export interface XoraAction {
  type: XoraActionType;
  label: string;
  route?: string;
  url?: string;
  textToCopy?: string;
  productId?: string;
  articleId?: string;
}

export interface XoraSourceCitation {
  title: string;
  url?: string;
  snippet?: string;
}

export interface XoraMessage {
  id: string;
  chatId: string;
  userId: string;
  role: XoraRole;
  content: string;
  actions?: XoraAction[];
  sources?: XoraSourceCitation[];
  createdAt: string;
  status: 'sent' | 'streaming' | 'complete' | 'error';
  model?: string;
  feedback?: 'helpful' | 'unhelpful';
}

export interface XoraChat {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  messageCount: number;
  lastMessageSnippet?: string;
}

export interface XoraMemory {
  id: string;
  userId: string;
  text: string;
  category: 'preference' | 'language' | 'goal' | 'fact';
  createdAt: string;
  updatedAt: string;
  sourceChatId?: string;
}

export interface XoraUserSettings {
  userId: string;
  memoryEnabled: boolean;
  preferredLanguage?: 'en' | 'sw';
  updatedAt: string;
}

export interface XoraAdminConfig {
  activeModel: string;
  availableModels: string[];
  systemInstructions: string;
  maxTokens: number;
  temperature: number;
  rateLimitPerMinute: number;
  isEnabled: boolean;
  enablePublicReader: boolean;
}

export interface XoraProviderStatus {
  ok: boolean;
  provider: string;
  model: string;
  latencyMs: number;
  configured: boolean;
  timestamp: string;
  errorMessage?: string;
}
