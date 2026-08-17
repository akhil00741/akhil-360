import { createContext } from 'react';
import { ClientContact, Shoot, PaymentRecord, AppTheme, PaymentMethod } from '../types/shoot';

export interface ShootContextType {
  shoots: Shoot[];
  contacts: ClientContact[];
  addShoot: (shoot: Omit<Shoot, 'id' | 'createdAt' | 'updatedAt' | 'balanceAmount'>) => Shoot;
  updateShoot: (id: string, updates: Partial<Shoot>) => void;
  deleteShoot: (id: string) => Promise<void>;
  markAsDelivered: (id: string, deliveredAtDate?: string, wfolioUrl?: string) => void;
  markDataCleared: (id: string, notes?: string) => void;
  addPayment: (shootId: string, payment: Omit<PaymentRecord, 'id'>) => void;
  getShootById: (id: string) => Shoot | undefined;
  importShoots: (newShoots: Partial<Shoot>[]) => void;
  clearAllData: () => Promise<void>;

  isSyncing: boolean;
  isCloudEnabled: boolean;
  lastSyncedAt: Date | null;
  triggerSync: () => Promise<void>;

  theme: AppTheme;
  toggleTheme: () => void;

  metrics: {
    totalShoots: number;
    totalRevenue: number;
    totalReceived: number;
    totalPending: number;
    digitalReceived: number;
    deliveredCount: number;
    inEditingCount: number;
    upcomingCount: number;
    clearedCount: number;
    retentionActiveCount: number;
    criticalClearanceCount: number;
    ownShootsCount: number;
    ownShootsRevenue: number;
    thirdPartyCount: number;
    thirdPartyRevenue: number;
    paymentMethodTotals: Record<PaymentMethod, number>;
  };

  activeTab: 'dashboard' | 'registry' | 'contacts' | 'calendar' | 'storage' | 'analytics';
  setActiveTab: (tab: 'dashboard' | 'registry' | 'contacts' | 'calendar' | 'storage' | 'analytics') => void;
  selectedShoot: Shoot | null;
  setSelectedShoot: (shoot: Shoot | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  reminderModalShoot: Shoot | null;
  setReminderModalShoot: (shoot: Shoot | null) => void;
}

export const ShootContext = createContext<ShootContextType | undefined>(undefined);
