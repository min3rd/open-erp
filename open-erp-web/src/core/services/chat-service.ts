import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { ConversationDto, MessageDto } from '../interfaces/chat.types';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private httpClient = inject(HttpClient);

  private _conversations: BehaviorSubject<ConversationDto[]> = new BehaviorSubject<any>(null);
  private _messages: BehaviorSubject<MessageDto[]> = new BehaviorSubject<any>(null);

  get conversations$(): Observable<ConversationDto[]> {
    return this._conversations.asObservable();
  }

  get messages$(): Observable<MessageDto[]> {
    return this._messages.asObservable();
  }

  loadConversations(): Observable<ConversationDto[]> {
    return this.httpClient.get<ConversationDto[]>('/data/chat/conversations.json').pipe(
      map((conversations) => {
        this._conversations.next(conversations);
        return conversations;
      })
    );
  }

  loadMessages() {}
}
