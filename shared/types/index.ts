export interface FareInfo {
  from: string;
  to: string;
  fare: number;
}

export interface ChatMessage {
  type: 'user' | 'bot';
  message: string;
  timestamp?: Date;
}

export type ViewType = 'home' | 'scanner' | 'chat' | 'fare' | 'route';

export interface QuickQuestion {
  id: string;
  text: string;
  category?: 'fare' | 'route' | 'time' | 'emergency';
}