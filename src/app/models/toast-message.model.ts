export interface ToastMessage {
  key?: string;
  severity?: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';
  summary?: string;
  detail?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
}