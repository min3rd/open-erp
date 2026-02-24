import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  ConversationDto,
  MessageDto,
  UploadedAttachment,
} from '../../interfaces/chat.types';
import { ChatService, ChatUserSearchResult } from '../../services/chat-service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { BadgeModule } from 'primeng/badge';
import { DrawerModule } from 'primeng/drawer';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'layout-quick-chat',
  imports: [
    CommonModule,
    FormsModule,
    SkeletonModule,
    AvatarModule,
    OverlayBadgeModule,
    RippleModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    BadgeModule,
    DrawerModule,
    RadioButtonModule,
    CheckboxModule,
    ProgressBarModule,
    TooltipModule,
    TranslocoModule,
  ],
  templateUrl: './quick-chat.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickChat implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  private _unsubscribeAll = new Subject<void>();
  private _searchQuery$ = new Subject<string>();

  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  conversations: ConversationDto[] | null = null;
  messages: MessageDto[] = [];
  selectedConversation: ConversationDto | null = null;
  messageText = '';
  loadingConversations = true;
  loadingMessages = false;
  sendingMessage = false;

  // Typing indicator
  typingUsers: Map<string, boolean> = new Map();

  // New conversation drawer
  drawerVisible = false;
  newChatMode: 'direct' | 'group' = 'direct';
  userSearchQuery = '';
  searchResults: ChatUserSearchResult[] = [];
  searchLoading = false;
  selectedUsers: ChatUserSearchResult[] = [];
  groupTitle = '';
  creatingConversation = false;

  // File attachments
  pendingAttachments: UploadedAttachment[] = [];
  uploadProgress = 0;
  uploading = false;

  ngOnInit(): void {
    // Subscribe to conversations
    this.chatService.conversations$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((conversations) => {
        this.conversations = conversations;
        this.loadingConversations = false;
        this.cdr.markForCheck();
      });

    // Subscribe to messages
    this.chatService.messages$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((messages) => {
        this.messages = messages;
        this.cdr.markForCheck();
        this._scrollToBottom();
      });

    // Subscribe to real-time new messages for toast notifications
    this.chatService.newMessage$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((msg) => {
        if (msg.conversationId !== this.selectedConversation?.id) {
          const conv = this.conversations?.find(
            (c) => c.id === msg.conversationId,
          );
          const senderName =
            conv?.participants.find((p) => p.id === msg.senderId)?.fullName ??
            'Someone';
          this.messageService.add({
            severity: 'info',
            summary: senderName,
            detail:
              msg.contentType === 'text'
                ? msg.content
                : '📎 Sent an attachment',
            life: 4000,
          });
        }
        this.cdr.markForCheck();
      });

    // Subscribe to typing events
    this.chatService.typing$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((event) => {
        if (event.conversationId === this.selectedConversation?.id) {
          this.typingUsers.set(event.userId, event.isTyping);
          this.cdr.markForCheck();
        }
      });

    // Debounced user search
    this._searchQuery$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this._unsubscribeAll))
      .subscribe((query) => {
        if (query.trim().length < 2) {
          this.searchResults = [];
          this.searchLoading = false;
          this.cdr.markForCheck();
          return;
        }
        this.searchLoading = true;
        this.chatService.searchUsers(query).subscribe({
          next: (results) => {
            this.searchResults = results;
            this.searchLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.searchLoading = false;
            this.cdr.markForCheck();
          },
        });
      });

    // Load conversations and connect WebSocket
    this._loadConversationsAndConnect();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    if (this.selectedConversation) {
      this.chatService.leaveConversation(this.selectedConversation.id);
    }
    this.chatService.disconnectSocket();
  }

  private _loadConversationsAndConnect(): void {
    this.chatService.loadConversations().subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingConversations = false;
        this.cdr.markForCheck();
      },
    });

    // Connect WebSocket with auth token
    const token = this.authService.accessToken;
    if (token) {
      this.chatService.connectSocket(token);
    }
  }

  openConversation(conversationId: string): void {
    if (this.selectedConversation?.id === conversationId) return;

    // Leave previous conversation
    if (this.selectedConversation) {
      this.chatService.leaveConversation(this.selectedConversation.id);
    }

    const conv = this.conversations?.find((c) => c.id === conversationId);
    if (!conv) return;

    this.selectedConversation = conv;
    this.messages = [];
    this.loadingMessages = true;
    this.typingUsers.clear();
    this.cdr.markForCheck();

    // Join WebSocket room
    this.chatService.joinConversation(conversationId);

    // Load messages
    this.chatService.loadMessages(conversationId).subscribe({
      next: () => {
        this.loadingMessages = false;
        // Mark as read
        this.chatService.markAsRead(conversationId).subscribe();
        // Reset unread count locally
        if (this.conversations) {
          const updated = this.conversations.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c,
          );
          this.conversations = updated;
        }
        this.cdr.markForCheck();
        this._scrollToBottom();
      },
      error: () => {
        this.loadingMessages = false;
        this.cdr.markForCheck();
      },
    });
  }

  closeConversation(): void {
    if (this.selectedConversation) {
      this.chatService.leaveConversation(this.selectedConversation.id);
    }
    this.selectedConversation = null;
    this.messages = [];
    this.messageText = '';
    this.pendingAttachments = [];
    this.chatService.clearMessages();
    this.cdr.markForCheck();
  }

  sendMessage(): void {
    const text = this.messageText.trim();
    const hasAttachments = this.pendingAttachments.length > 0;
    if ((!text && !hasAttachments) || !this.selectedConversation || this.sendingMessage) return;

    const conversationId = this.selectedConversation.id;
    const type =
      hasAttachments
        ? this.pendingAttachments[0].mimeType.startsWith('image/')
          ? 'image'
          : this.pendingAttachments[0].mimeType.startsWith('video/')
            ? 'video'
            : 'file'
        : 'text';

    this.sendingMessage = true;
    this.chatService
      .sendMessageHttp({
        conversationId,
        type: type as any,
        content: text || undefined,
        attachments: hasAttachments
          ? this.pendingAttachments.map((a) => ({
              url: a.url,
              filename: a.filename,
              mimeType: a.mimeType,
              size: a.size,
            }))
          : undefined,
      })
      .subscribe({
        next: () => {
          this.messageText = '';
          this.pendingAttachments = [];
          this.sendingMessage = false;
          this.chatService.sendTyping(conversationId, false);
          this.cdr.markForCheck();
          this._scrollToBottom();
        },
        error: () => {
          this.sendingMessage = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to send message',
            life: 3000,
          });
          this.cdr.markForCheck();
        },
      });
  }

  onMessageKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.sendMessage();
    } else if (this.selectedConversation) {
      this.chatService.sendTyping(this.selectedConversation.id, true);
    }
  }

  onFileAttach(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl =
          file.type.startsWith('image/') || file.type.startsWith('video/')
            ? (e.target?.result as string)
            : undefined;
        // Use local blob URL for now (production would use presign upload)
        const attachment: UploadedAttachment = {
          url: URL.createObjectURL(file),
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          previewUrl,
        };
        this.pendingAttachments = [...this.pendingAttachments, attachment];
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    input.value = '';
  }

  removeAttachment(index: number): void {
    this.pendingAttachments = this.pendingAttachments.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  // ── New conversation drawer ─────────────────────────────────────────────

  openDrawer(): void {
    this.drawerVisible = true;
    this.newChatMode = 'direct';
    this.userSearchQuery = '';
    this.searchResults = [];
    this.selectedUsers = [];
    this.groupTitle = '';
    this.cdr.markForCheck();
  }

  onSearchQueryChange(query: string): void {
    this._searchQuery$.next(query);
  }

  toggleUserSelection(user: ChatUserSearchResult): void {
    const idx = this.selectedUsers.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.selectedUsers = this.selectedUsers.filter((u) => u.id !== user.id);
    } else {
      if (this.newChatMode === 'direct') {
        this.selectedUsers = [user];
      } else {
        this.selectedUsers = [...this.selectedUsers, user];
      }
    }
    this.cdr.markForCheck();
  }

  isUserSelected(user: ChatUserSearchResult): boolean {
    return this.selectedUsers.some((u) => u.id === user.id);
  }

  createConversation(): void {
    if (!this.selectedUsers.length || this.creatingConversation) return;

    this.creatingConversation = true;
    const obs =
      this.newChatMode === 'direct'
        ? this.chatService.createDirectConversation({
            participantId: this.selectedUsers[0].id,
          })
        : this.chatService.createGroupConversation({
            name: this.groupTitle.trim() || this.selectedUsers.map((u) => u.fullName).join(', '),
            participantIds: this.selectedUsers.map((u) => u.id),
          });

    obs.subscribe({
      next: (conv) => {
        this.creatingConversation = false;
        this.drawerVisible = false;
        this.cdr.markForCheck();
        // Open the newly created conversation
        this.openConversation(conv.id);
      },
      error: () => {
        this.creatingConversation = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create conversation',
          life: 3000,
        });
        this.cdr.markForCheck();
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  getSenderInfo(message: MessageDto) {
    return this.selectedConversation?.participants.find(
      (p) => p.id === message.senderId,
    ) ?? null;
  }

  isSelf(message: MessageDto): boolean {
    // We don't have currentUserId easily without decoding JWT, so we use a heuristic:
    // If there's only 1 participant in the conversation, messages from them are "theirs"
    // For group chats, the last participant slot is typically the "other"
    // This is a UI concern — the backend will handle actual authorization
    // For now treat it by checking if senderId matches the first participant (the "other") in direct chats
    if (!this.selectedConversation) return false;
    if (this.selectedConversation.participants.length === 1) {
      return message.senderId === this.selectedConversation.participants[0]?.id;
    }
    // For group chats, return false for all (don't style as self)
    return false;
  }

  getConversationTitle(conv: ConversationDto): string {
    if (conv.title) return conv.title;
    const names = conv.participants.map((p) => p.fullName ?? p.email ?? '?');
    return names.join(', ');
  }

  getConversationAvatarLabel(conv: ConversationDto): string {
    const title = this.getConversationTitle(conv);
    return title.charAt(0).toUpperCase();
  }

  getLastMessageSnippet(conv: ConversationDto): string {
    const msg = conv.lastMessage;
    if (!msg) return '';
    if (msg.contentType !== 'text') return '📎 Attachment';
    const content = msg.content ?? '';
    return content.length > 40 ? content.slice(0, 40) + '…' : content;
  }

  formatTime(dateStr?: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  isImageType(mimeType?: string): boolean {
    return !!mimeType?.startsWith('image/');
  }

  isVideoType(mimeType?: string): boolean {
    return !!mimeType?.startsWith('video/');
  }

  getTypingText(): string {
    const typingUserIds = [...this.typingUsers.entries()]
      .filter(([, isTyping]) => isTyping)
      .map(([id]) => id);
    if (!typingUserIds.length) return '';
    const names = typingUserIds
      .map(
        (id) =>
          this.selectedConversation?.participants.find((p) => p.id === id)
            ?.fullName ?? 'Someone',
      )
      .join(', ');
    return `${names} is typing…`;
  }

  get hasTypingUsers(): boolean {
    return [...this.typingUsers.values()].some(Boolean);
  }

  get totalUnread(): number {
    return (
      this.conversations?.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) ?? 0
    );
  }

  private _scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}

