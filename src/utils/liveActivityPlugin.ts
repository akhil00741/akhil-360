import { registerPlugin } from '@capacitor/core';

export interface LiveActivityPlugin {
  startActivity(options: { 
    name: string; 
    timeRemaining: number; 
    venue: string;
    progress: number;
  }): Promise<{ id: string }>;
  
  updateActivity(options: { 
    id: string; 
    timeRemaining: number;
    progress: number;
  }): Promise<void>;
  
  endActivity(options: { id: string }): Promise<void>;
}

export const LiveActivity = registerPlugin<LiveActivityPlugin>('LiveActivity');
