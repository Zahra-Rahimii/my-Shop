import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastMessage } from '../models/toast-message.model';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private messageService = inject(MessageService);
  private recentMessages: Set<string> = new Set();
  private maxMessages = 3;
  private messageQueue: ToastMessage[] = [];

  private clearMessages() {
    this.messageService.clear();
    this.recentMessages.clear();
    this.messageQueue = [];
  }

  private isDuplicateMessage(summary: string, detail: string): boolean {
    const messageKey = `${summary}:${detail}`;
    if (this.recentMessages.has(messageKey)) {
      return true;
    }
    this.recentMessages.add(messageKey);
    setTimeout(() => this.recentMessages.delete(messageKey), 5000);
    return false;
  }

  private showNextMessage() {
    if (this.messageQueue.length === 0) return;
    if (this.messageQueue.length > this.maxMessages) {
      this.messageQueue = this.messageQueue.slice(0, this.maxMessages);
    }
    const message = this.messageQueue.shift();
    if (message) {
      this.messageService.add(message);
    }
  }

  success(summary: string, detail: string, life: number = 3000) {
    if (this.isDuplicateMessage(summary, detail)) return;
    this.messageQueue.push({
      key: 'global',
      severity: 'success',
      summary,
      detail,
      life
    });
    this.showNextMessage();
  }

  info(summary: string, detail: string, life: number = 3000) {
    if (this.isDuplicateMessage(summary, detail)) return;
    this.messageQueue.push({
      key: 'global',
      severity: 'info',
      summary,
      detail,
      life
    });
    this.showNextMessage();
  }

  warn(summary: string, detail: string, life: number = 3000) {
    if (this.isDuplicateMessage(summary, detail)) return;
    this.messageQueue.push({
      key: 'global',
      severity: 'warn',
      summary,
      detail,
      life
    });
    this.showNextMessage();
  }

  error(summary: string, detail: string, life: number = 5000) {
    if (this.isDuplicateMessage(summary, detail)) return;
    this.messageQueue.push({
      key: 'global',
      severity: 'error',
      summary,
      detail,
      life
    });
    this.showNextMessage();
  }

  secondary(summary: string, detail: string, life: number = 3000) {
    if (this.isDuplicateMessage(summary, detail)) return;
    this.messageQueue.push({
      key: 'global',
      severity: 'secondary',
      summary,
      detail,
      life
    });
    this.showNextMessage();
  }

  contrast(summary: string, detail: string, life: number = 3000) {
    if (this.isDuplicateMessage(summary, detail)) return;
    this.messageQueue.push({
      key: 'global',
      severity: 'contrast',
      summary,
      detail,
      life
    });
    this.showNextMessage();
  }
}