export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export type NewContactMessage = Omit<ContactMessage, 'id' | 'createdAt' | 'isRead'>;
