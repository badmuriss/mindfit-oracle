import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiService } from '../../api/api.service';
import { ToastService } from '../../shared/services/toast.service';

export interface ChatMessage {
  prompt: string;
  response: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container mx-auto p-6">
      <!-- Header -->
      <mat-card class="mb-6">
        <div class="p-6">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-900">
              AI Chatbot for User {{ userId }}
            </h1>
            <button mat-raised-button (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Back to User Detail
            </button>
          </div>
        </div>
      </mat-card>

      <!-- Chat Interface -->
      <mat-card class="h-96">
        <div class="flex flex-col h-full">
          <!-- Chat History -->
          <div class="flex-1 p-4 overflow-y-auto bg-gray-50" #chatContainer>
            <div *ngIf="messages.length === 0" class="flex items-center justify-center h-full text-gray-500">
              <div class="text-center">
                <mat-icon class="text-6xl mb-4">chat</mat-icon>
                <p>Start a conversation with the AI</p>
              </div>
            </div>
            
            <div *ngFor="let message of messages" class="mb-4">
              <!-- User Message -->
              <div class="flex justify-end mb-2">
                <div class="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                  {{ message.prompt }}
                </div>
              </div>
              
              <!-- AI Response -->
              <div class="flex justify-start">
                <div class="bg-white border rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                  {{ message.response }}
                </div>
              </div>
            </div>

            <!-- Loading indicator -->
            <div *ngIf="isLoading" class="flex justify-start">
              <div class="bg-white border rounded-lg px-4 py-2 flex items-center gap-2">
                <mat-spinner diameter="16"></mat-spinner>
                <span class="text-gray-500">AI is thinking...</span>
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="border-t p-4 bg-white">
            <form [formGroup]="chatForm" (ngSubmit)="sendMessage()" class="flex gap-3">
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Type your message</mat-label>
                <input matInput 
                       formControlName="prompt"
                       placeholder="Ask the AI about this user..."
                       [disabled]="isLoading">
              </mat-form-field>
              
              <button mat-raised-button 
                      color="primary" 
                      type="submit"
                      [disabled]="chatForm.invalid || isLoading"
                      class="flex items-center gap-2">
                <mat-icon>send</mat-icon>
                Send
              </button>
            </form>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { max-width: 1000px; }
    mat-card {
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .chat-container {
      scroll-behavior: smooth;
    }
  `]
})
export class ChatbotComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  userId!: string;
  chatForm: FormGroup;
  messages: ChatMessage[] = [];
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService,
    private toast: ToastService
  ) {
    this.chatForm = this.fb.group({
      prompt: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.params['id'];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  sendMessage(): void {
    if (this.chatForm.valid && !this.isLoading) {
      const prompt = this.chatForm.get('prompt')?.value?.trim();
      if (!prompt) return;

      this.isLoading = true;
      
      // Add user message to chat immediately
      const userMessage: ChatMessage = {
        prompt: prompt,
        response: '',
        timestamp: new Date()
      };

      this.apiService.post<{ response: string }>(`/users/${this.userId}/chatbot`, { prompt })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            userMessage.response = response.response;
            this.messages.push(userMessage);
            this.chatForm.reset();
            this.isLoading = false;
            this.scrollToBottom();
          },
          error: (error) => {
            console.error('Failed to send message:', error);
            this.toast.error('Failed to send message to AI');
            this.isLoading = false;
          }
        });
    }
  }

  goBack(): void {
    this.router.navigate(['/users', this.userId]);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
}