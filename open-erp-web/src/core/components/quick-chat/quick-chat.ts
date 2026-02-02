import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ConversationDto, MessageDto } from '../../interfaces/chat.types';
import { ChatService } from '../../services/chat-service';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

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
    TranslocoModule,
  ],
  templateUrl: './quick-chat.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickChat implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private cdr = inject(ChangeDetectorRef);

  private _unsubscribeAll: Subject<any> = new Subject();

  conversations!: ConversationDto[];
  messages!: MessageDto[];
  selectedConversation!: ConversationDto | null;
  messageText: string = '';

  ngOnInit(): void {
    this.chatService.conversations$.pipe().subscribe((conversations) => {
      this.conversations = conversations;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  openConversation(id: string) {
    this.selectedConversation = this.conversations.filter((e) => e.id === id)[0];
  }
}
