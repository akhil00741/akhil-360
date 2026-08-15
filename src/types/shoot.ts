export type ShootType = 'own' | 'third_party';

export type ShootStatus = 'booked' | 'in_progress' | 'editing' | 'delivered' | 'data_cleared';

export type ShootCategory = 
  | 'Wedding'
  | 'Pre-Wedding'
  | 'Engagement'
  | 'Haldi / Mehendi'
  | 'Reception'
  | 'Birthday / Kids'
  | 'Maternity / Newborn'
  | 'Fashion / Portfolio'
  | 'Commercial / Brand'
  | 'Corporate / Event'
  | 'Architecture / Interior'
  | 'Other';

export type PaymentMethod = 
  | 'Cash'
  | 'UPI'
  | 'Bank Transfer'
  | 'Card'
  | 'Cheque'
  | 'Other';

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface ShootEventSlot {
  id: string;
  name: string; // e.g. "Morning Muhurtham", "Haldi Ceremony"
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string;
  allocatedIncome?: number; // event time-to-time basis income
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  notes?: string;
}

export interface Shoot {
  id: string;
  title: string;
  category: ShootCategory;
  shootType: ShootType; // 'own' or 'third_party'
  
  // If third party shoot
  agencyName?: string;
  referredBy?: string;
  thirdPartyContact?: string;
  
  // Client details
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientInstagram?: string;
  location: string;
  
  // Timeline and event slots (time-to-time basis)
  primaryDate: string; // YYYY-MM-DD
  events: ShootEventSlot[];
  
  // Financials
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  primaryPaymentMethod?: PaymentMethod;
  payments: PaymentRecord[];
  
  // Workflow Pipeline
  status: ShootStatus;
  bookedAt: string;
  shotAt?: string;
  deliveredAt?: string; // Delivery timestamp that triggers 30-day retention
  
  // 30-Day Data Retention
  retentionDaysLimit: number; // default 30
  dataRetentionDeadline?: string; // deliveredAt + 30 days
  isDataCleared: boolean;
  dataClearedAt?: string;
  storageDevice?: string; // e.g. "SSD-01 / SanDisk Extreme"
  rawFilesSizeGb?: number;
  
  // wfolio Integration
  wfolioUrl?: string;
  wfolioPassword?: string;
  wfolioStatus: 'none' | 'pending' | 'published' | 'delivered';
  
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReminderTemplate {
  id: string;
  title: string;
  description: string;
  type: 'shoot_confirmation' | 'delivery_ready' | 'payment_balance' | 'retention_15day' | 'retention_48hr_final' | 'feedback';
  badge: string;
  template: (shoot: Shoot) => string;
}

export type ViewTab = 'dashboard' | 'registry' | 'calendar' | 'storage' | 'analytics';
export type AppTheme = 'light' | 'dark';
