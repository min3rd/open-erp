import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ConversationDto,
  MessageDto,
  SendMessagePayload,
  CreateDirectConversationPayload,
  CreateGroupConversationPayload,
  TypingEvent,
  WsMessagesReadEvent,
} from '../interfaces/chat.types';
import { HttpClient } from '@angular/common/http';
import { API_URI_CHAT, API_URI_USER } from '../constant';
import { AuthService } from './auth-service';

export interface ChatUserSearchResult {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  username?: string;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  objectKey: string;
  bucket: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService implements OnDestroy {
  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);

  private _destroy$ = new Subject<void>();

  private _conversations = new BehaviorSubject<ConversationDto[]>([]);
  private _messages = new BehaviorSubject<MessageDto[]>([]);
  private _newMessage$ = new Subject<MessageDto>();
  private _typing$ = new Subject<TypingEvent>();
  private _messagesRead$ = new Subject<WsMessagesReadEvent>();

  private _socket: any = null;
  private _activeConversationId: string | null = null;

  get conversations$(): Observable<ConversationDto[]> {
    return this._conversations.asObservable();
  }

  get messages$(): Observable<MessageDto[]> {
    return this._messages.asObservable();
  }

  get newMessage$(): Observable<MessageDto> {
    return this._newMessage$.asObservable();
  }

  get typing$(): Observable<TypingEvent> {
    return this._typing$.asObservable();
  }

  get messagesRead$(): Observable<WsMessagesReadEvent> {
    return this._messagesRead$.asObservable();
  }

  // ── HTTP: Conversations ──────────────────────────────────────────────────

  loadConversations(page = 1, limit = 50): Observable<ConversationDto[]> {
    return this.httpClient
      .get<any>(`${API_URI_CHAT}/v1/conversations`, { params: { page, limit } })
      .pipe(
        map((res) => {
          const items: ConversationDto[] = this._normalizeConversations(
            res?.data?.items ?? res ?? [],
          );
          this._conversations.next(items);
          return items;
        }),
      );
  }

  loadMessages(
    conversationId: string,
    page = 1,
    limit = 50,
  ): Observable<MessageDto[]> {
    return this.httpClient
      .get<any>(`${API_URI_CHAT}/v1/conversations/${conversationId}/messages`, {
        params: { page, limit },
      })
      .pipe(
        map((res) => {
          const items: MessageDto[] = this._normalizeMessages(
            res?.data?.items ?? res ?? [],
          );
          // Sort so newest is at bottom
          const sorted = [...items].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          this._messages.next(sorted);
          return sorted;
        }),
      );
  }

  sendMessageHttp(payload: SendMessagePayload): Observable<MessageDto> {
    return this.httpClient
      .post<any>(
        `${API_URI_CHAT}/v1/conversations/${payload.conversationId}/messages`,
        {
          conversationId: payload.conversationId,
          type: payload.type,
          content: payload.content,
          attachments: payload.attachments,
        },
      )
      .pipe(
        map((res) => {
          const msg = this._normalizeMessage(res?.data?.item ?? res);
          // Append to messages list
          const current = this._messages.getValue();
          this._messages.next([...current, msg]);
          // Update last message in conversations
          this._updateConversationLastMessage(payload.conversationId, msg);
          return msg;
        }),
      );
  }

  markAsRead(conversationId: string): Observable<any> {
    return this.httpClient.post<any>(
      `${API_URI_CHAT}/v1/conversations/${conversationId}/read`,
      {},
    );
  }

  createDirectConversation(
    payload: CreateDirectConversationPayload,
  ): Observable<ConversationDto> {
    return this.httpClient
      .post<any>(`${API_URI_CHAT}/v1/conversations/direct`, payload)
      .pipe(
        map((res) => {
          const conv = this._normalizeConversation(res?.data?.item ?? res);
          // Add to conversations list if not already present
          const current = this._conversations.getValue();
          if (!current.find((c) => c.id === conv.id)) {
            this._conversations.next([conv, ...current]);
          }
          return conv;
        }),
      );
  }

  createGroupConversation(
    payload: CreateGroupConversationPayload,
  ): Observable<ConversationDto> {
    return this.httpClient
      .post<any>(`${API_URI_CHAT}/v1/conversations/group`, payload)
      .pipe(
        map((res) => {
          const conv = this._normalizeConversation(res?.data?.item ?? res);
          const current = this._conversations.getValue();
          if (!current.find((c) => c.id === conv.id)) {
            this._conversations.next([conv, ...current]);
          }
          return conv;
        }),
      );
  }

  searchUsers(query: string, limit = 20): Observable<ChatUserSearchResult[]> {
    return this.httpClient
      .get<any>(`${API_URI_USER}/v1/users`, {
        params: { q: query, size: limit },
      })
      .pipe(
        map((res) => {
          const items = res?.data?.items ?? res?.data ?? res ?? [];
          return (Array.isArray(items) ? items : []).map((u: any) => ({
            id: u.id ?? u._id,
            email: u.email,
            fullName: u.fullName,
            avatarUrl: u.avatarUrl ?? u.avatar ?? null,
            username: u.username,
          }));
        }),
      );
  }

  // ── WebSocket ──────────────────────────────────────────────────────────

  connectSocket(token: string): void {
    if (this._socket?.connected) return;

    // Lazy-load socket.io-client to keep initial bundle small
    import('socket.io-client').then(({ io }) => {
      this._socket = io(`${API_URI_CHAT}/chat`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 5,
      });

      this._socket.on('newMessage', (data: any) => {
        const msg = this._normalizeMessage(data);
        this._newMessage$.next(msg);
        // If this conversation is active, append to messages
        if (msg.conversationId === this._activeConversationId) {
          const current = this._messages.getValue();
          // Avoid duplicates
          if (!current.find((m) => m.id === msg.id)) {
            this._messages.next([...current, msg]);
          }
        }
        // Update last message & unread count in conversations list
        this._updateConversationLastMessage(msg.conversationId, msg, true);
      });

      this._socket.on('messageEdited', (data: any) => {
        const msg = this._normalizeMessage(data);
        const current = this._messages.getValue();
        this._messages.next(current.map((m) => (m.id === msg.id ? msg : m)));
      });

      this._socket.on('messageDeleted', (data: any) => {
        const id = data?.messageId ?? data?._id;
        if (!id) return;
        const current = this._messages.getValue();
        this._messages.next(
          current.map((m) =>
            m.id === id ? { ...m, deleted: true, content: '' } : m,
          ),
        );
      });

      this._socket.on('userTyping', (data: TypingEvent) => {
        this._typing$.next(data);
      });

      this._socket.on('messagesRead', (data: WsMessagesReadEvent) => {
        this._messagesRead$.next(data);
      });
    });
  }

  joinConversation(conversationId: string): void {
    this._activeConversationId = conversationId;
    this._socket?.emit('joinConversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    if (this._activeConversationId === conversationId) {
      this._activeConversationId = null;
    }
    this._socket?.emit('leaveConversation', { conversationId });
  }

  sendTyping(conversationId: string, isTyping: boolean): void {
    this._socket?.emit('typing', { conversationId, isTyping });
  }

  disconnectSocket(): void {
    this._socket?.disconnect();
    this._socket = null;
  }

  clearMessages(): void {
    this._messages.next([]);
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this.disconnectSocket();
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private _normalizeConversations(items: any[]): ConversationDto[] {
    return (Array.isArray(items) ? items : []).map((c) =>
      this._normalizeConversation(c),
    );
  }

  private _normalizeConversation(c: any): ConversationDto {
    const convType = c.type ?? (c.participants?.length > 1 ? 'group' : 'direct');
    return {
      id: c.id ?? c._id?.toString(),
      _id: c._id?.toString(),
      type: convType,
      // Backend stores group name in 'name'; keep 'title' alias for display
      name: c.name ?? null,
      title: c.name ?? c.title ?? null,
      avatarUrl: c.avatarUrl ?? null,
      participants: (c.participants ?? []).map((p: any) =>
        this._normalizeParticipant(p),
      ),
      lastMessage: c.lastMessage
        ? this._normalizeMessage(c.lastMessage)
        : null,
      lastMessageAt: c.lastMessageAt ?? null,
      lastMessagePreview: c.lastMessagePreview ?? null,
      unreadCount: c.unreadCount ?? 0,
      isMuted: c.isMuted ?? false,
      isPinned: c.isPinned ?? false,
      isGroup: convType === 'group',
      metadata: c.metadata,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  private _normalizeParticipant(p: any) {
    return {
      id: p.id ?? p._id?.toString(),
      email: p.email,
      fullName: p.fullName,
      avatarUrl: p.avatarUrl ?? null,
      roles: p.roles ?? [],
    };
  }

  private _normalizeMessages(items: any[]): MessageDto[] {
    return (Array.isArray(items) ? items : []).map((m) =>
      this._normalizeMessage(m),
    );
  }

  private _normalizeMessage(m: any): MessageDto {
    const type = (m.type ?? m.contentType ?? 'text') as any;
    return {
      id: m.id ?? m._id?.toString(),
      _id: m._id?.toString(),
      conversationId: m.conversationId?.toString?.() ?? m.conversationId,
      senderId: m.senderId?.toString?.() ?? m.senderId,
      content: m.content ?? null,
      type,
      contentType: type,
      attachments: (m.attachments ?? []).map((a: any) => ({
        url: a.url,
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size ?? 0,
      })),
      readBy: m.readBy ?? [],
      editedAt: m.editedAt ?? null,
      deletedAt: m.deletedAt ?? null,
      status: m.status ?? 'sent',
      edited: !!m.editedAt,
      deleted: !!m.deletedAt,
      metadata: m.metadata,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  private _updateConversationLastMessage(
    conversationId: string,
    msg: MessageDto,
    incrementUnread = false,
  ): void {
    const current = this._conversations.getValue();
    const updated = current.map((c) => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        lastMessage: msg,
        unreadCount:
          incrementUnread && c.id !== this._activeConversationId
            ? (c.unreadCount ?? 0) + 1
            : c.unreadCount,
        updatedAt: msg.createdAt,
      };
    });
    // Sort by latest message
    updated.sort((a, b) => {
      const ta = a.lastMessage?.createdAt ?? a.updatedAt ?? a.createdAt;
      const tb = b.lastMessage?.createdAt ?? b.updatedAt ?? b.createdAt;
      return new Date(tb).getTime() - new Date(ta).getTime();
    });
    this._conversations.next(updated);
  }
}
