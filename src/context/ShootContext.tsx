import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Shoot, PaymentRecord, AppTheme, PaymentMethod, PaymentStatus } from '../types/shoot';
import { INITIAL_SHOOTS } from '../data/sampleData';
import { addDays, format } from 'date-fns';
import { fetchCloudShoots, saveCloudShoots } from '../utils/cloudSync';

const STORAGE_KEY = 'akhil_360_shoots_prod_v1';
const DELETED_KEY = 'akhil_360_deleted_ids_v1';
const THEME_KEY = 'akhil_360_theme';

interface ShootContextType {
  shoots: Shoot[];
  addShoot: (shoot: Omit<Shoot, 'id' | 'createdAt' | 'updatedAt' | 'balanceAmount'>) => Shoot;
  updateShoot: (id: string, updates: Partial<Shoot>) => void;
  deleteShoot: (id: string) => Promise<void>;
  markAsDelivered: (id: string, deliveredAtDate?: string, wfolioUrl?: string) => void;
  markDataCleared: (id: string, notes?: string) => void;
  addPayment: (shootId: string, payment: Omit<PaymentRecord, 'id'>) => void;
  getShootById: (id: string) => Shoot | undefined;
  importShoots: (newShoots: Partial<Shoot>[]) => void;
  
  // Cloud Real-Time Sync
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  triggerSync: () => Promise<void>;

  // Theme
  theme: AppTheme;
  toggleTheme: () => void;

  // Metrics & Stats
  metrics: {
    totalShoots: number;
    totalRevenue: number;
    totalReceived: number;
    totalPending: number;
    cashReceived: number;
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

  // UI state
  activeTab: 'dashboard' | 'registry' | 'calendar' | 'storage' | 'analytics';
  setActiveTab: (tab: 'dashboard' | 'registry' | 'calendar' | 'storage' | 'analytics') => void;
  selectedShoot: Shoot | null;
  setSelectedShoot: (shoot: Shoot | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  reminderModalShoot: Shoot | null;
  setReminderModalShoot: (shoot: Shoot | null) => void;
  resetToSampleData: () => void;
}

const ShootContext = createContext<ShootContextType | undefined>(undefined);

export const ShootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(DELETED_KEY);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {}
    return new Set<string>();
  });
  const deletedIdsRef = useRef<Set<string>>(deletedIds);
  deletedIdsRef.current = deletedIds;

  const [shoots, setShoots] = useState<Shoot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Shoot[] = JSON.parse(saved);
        const savedDeleted = localStorage.getItem(DELETED_KEY);
        const delSet = savedDeleted ? new Set(JSON.parse(savedDeleted)) : new Set();
        return parsed.filter(s => !delSet.has(s.id));
      }
    } catch (e) {
      console.error('Failed to parse shoots from local storage', e);
    }
    return INITIAL_SHOOTS;
  });

  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem(THEME_KEY) as AppTheme) || 'light';
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const shootsRef = useRef<Shoot[]>(shoots);
  shootsRef.current = shoots;

  const [activeTab, setActiveTab] = useState<'dashboard' | 'registry' | 'calendar' | 'storage' | 'analytics'>('dashboard');
  const [selectedShoot, setSelectedShoot] = useState<Shoot | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reminderModalShoot, setReminderModalShoot] = useState<Shoot | null>(null);

  // Sync to Cloud function with Tombstone Deletion protection
  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const cloudData = await fetchCloudShoots();
      if (cloudData && Array.isArray(cloudData)) {
        // Filter out any shoot that was deleted
        const activeCloudShoots = cloudData.filter(s => !deletedIdsRef.current.has(s.id));
        const localMap = new Map(shootsRef.current.map(s => [s.id, s]));
        let hasChanges = false;

        // Check if any deleted shoot is still in the cloud
        if (activeCloudShoots.length !== cloudData.length) {
          hasChanges = true;
        }

        activeCloudShoots.forEach(cloudShoot => {
          const localShoot = localMap.get(cloudShoot.id);
          if (!localShoot || (new Date(cloudShoot.updatedAt || 0) > new Date(localShoot.updatedAt || 0))) {
            localMap.set(cloudShoot.id, cloudShoot);
            hasChanges = true;
          }
        });

        // Check local shoots vs cloud
        localMap.forEach((shoot, id) => {
          if (deletedIdsRef.current.has(id)) {
            localMap.delete(id);
            hasChanges = true;
          }
        });

        const merged = Array.from(localMap.values()).filter(s => !deletedIdsRef.current.has(s.id));
        setShoots(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

        if (hasChanges || cloudData.length !== merged.length) {
          await saveCloudShoots(merged);
        }
      } else if (shootsRef.current.length > 0) {
        const cleanShoots = shootsRef.current.filter(s => !deletedIdsRef.current.has(s.id));
        await saveCloudShoots(cleanShoots);
      }
      setLastSyncedAt(new Date());
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Sync on initial load and set background periodic sync
  useEffect(() => {
    triggerSync();

    const interval = setInterval(() => {
      triggerSync();
    }, 15000); // Check every 15 seconds

    const handleFocus = () => {
      triggerSync();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [triggerSync]);

  // Persist to local storage and sync to cloud
  const persistShoots = (newShoots: Shoot[]) => {
    const cleanShoots = newShoots.filter(s => !deletedIdsRef.current.has(s.id));
    setShoots(cleanShoots);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanShoots));
    saveCloudShoots(cleanShoots).then(() => {
      setLastSyncedAt(new Date());
    });
  };

  const toggleTheme = () => {
    const nextTheme: AppTheme = 'light';
    setTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  };

  const addShoot = (shootData: Omit<Shoot, 'id' | 'createdAt' | 'updatedAt' | 'balanceAmount'>): Shoot => {
    const now = new Date().toISOString();
    const balanceAmount = Math.max(0, shootData.totalAmount - (shootData.advanceAmount || 0));
    
    let paymentStatus: PaymentStatus = 'unpaid';
    if (balanceAmount === 0 && shootData.totalAmount > 0) {
      paymentStatus = 'paid';
    } else if (shootData.advanceAmount > 0) {
      paymentStatus = 'partial';
    }

    const newShoot: Shoot = {
      ...shootData,
      id: `shoot-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      balanceAmount,
      paymentStatus,
      bookedAt: shootData.bookedAt || now,
      retentionDaysLimit: shootData.retentionDaysLimit || 30,
      createdAt: now,
      updatedAt: now,
      events: shootData.events || [
        {
          id: `evt-${Date.now()}-1`,
          name: 'Main Shoot',
          date: shootData.primaryDate,
          startTime: '09:00',
          endTime: '17:00',
          venue: shootData.location || 'Studio',
          allocatedIncome: shootData.totalAmount,
        }
      ],
      payments: shootData.advanceAmount > 0 ? [
        {
          id: `pay-${Date.now()}`,
          amount: shootData.advanceAmount,
          date: shootData.primaryDate,
          method: 'Cash',
          notes: 'Initial Advance Deposit',
        }
      ] : [],
    };

    const updatedShoots = [newShoot, ...shoots];
    persistShoots(updatedShoots);
    return newShoot;
  };

  const updateShoot = (id: string, updates: Partial<Shoot>) => {
    const updatedShoots = shoots.map((s) => {
      if (s.id === id) {
        const totalAmount = updates.totalAmount !== undefined ? updates.totalAmount : s.totalAmount;
        const advanceAmount = updates.advanceAmount !== undefined ? updates.advanceAmount : s.advanceAmount;
        const balanceAmount = Math.max(0, totalAmount - advanceAmount);
        
        let paymentStatus = s.paymentStatus;
        if (balanceAmount === 0 && totalAmount > 0) {
          paymentStatus = 'paid';
        } else if (advanceAmount > 0) {
          paymentStatus = 'partial';
        } else {
          paymentStatus = 'unpaid';
        }

        return {
          ...s,
          ...updates,
          balanceAmount,
          paymentStatus: updates.paymentStatus || paymentStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    persistShoots(updatedShoots);

    if (selectedShoot && selectedShoot.id === id) {
      setSelectedShoot(updatedShoots.find((s) => s.id === id) || null);
    }
  };

  const deleteShoot = async (id: string) => {
    // 1. Add to deleted tombstone list
    const newDeleted = new Set(deletedIdsRef.current);
    newDeleted.add(id);
    setDeletedIds(newDeleted);
    deletedIdsRef.current = newDeleted;
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(newDeleted)));

    // 2. Remove from local state
    const updatedShoots = shootsRef.current.filter((s) => s.id !== id);
    setShoots(updatedShoots);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedShoots));

    if (selectedShoot?.id === id) {
      setSelectedShoot(null);
    }

    // 3. Immediately overwrite cloud database
    setIsSyncing(true);
    try {
      await saveCloudShoots(updatedShoots);
      setLastSyncedAt(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  const markAsDelivered = (id: string, deliveredAtDate?: string, wfolioUrl?: string) => {
    const now = deliveredAtDate || format(new Date(), 'yyyy-MM-dd');
    const dataRetentionDeadline = format(addDays(new Date(now), 30), 'yyyy-MM-dd');

    updateShoot(id, {
      status: 'delivered',
      deliveredAt: now,
      dataRetentionDeadline,
      isDataCleared: false,
      wfolioStatus: 'delivered',
      ...(wfolioUrl ? { wfolioUrl } : {}),
    });
  };

  const markDataCleared = (id: string, notes?: string) => {
    const shoot = shoots.find(s => s.id === id);
    const existingNotes = shoot?.notes ? `${shoot.notes}\n` : '';
    const clearNote = `[DATA CLEARED on ${format(new Date(), 'dd MMM yyyy')}] Raw files purged from storage drive.`;
    
    updateShoot(id, {
      status: 'data_cleared',
      isDataCleared: true,
      notes: `${existingNotes}${clearNote}`,
    });
  };

  const addPayment = (shootId: string, payment: Omit<PaymentRecord, 'id'>) => {
    const target = shoots.find((s) => s.id === shootId);
    if (!target) return;

    const newPaymentRecord: PaymentRecord = {
      ...payment,
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };

    const newAdvance = (target.advanceAmount || 0) + payment.amount;
    const newPayments = [...(target.payments || []), newPaymentRecord];

    updateShoot(shootId, {
      advanceAmount: newAdvance,
      payments: newPayments,
    });
  };

  const getShootById = (id: string) => {
    return shoots.find((s) => s.id === id);
  };

  const importShoots = (newShoots: Partial<Shoot>[]) => {
    const now = new Date().toISOString();
    const formatted: Shoot[] = newShoots.map((s, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      title: s.title || 'Untitled Shoot',
      category: s.category || 'Wedding',
      shootType: s.shootType || 'own',
      agencyName: s.agencyName || '',
      referredBy: s.referredBy || '',
      clientName: s.clientName || 'Client',
      clientPhone: s.clientPhone || '',
      clientEmail: s.clientEmail || '',
      clientInstagram: s.clientInstagram || '',
      primaryDate: s.primaryDate || format(new Date(), 'yyyy-MM-dd'),
      location: s.location || 'Studio Location',
      totalAmount: s.totalAmount || 0,
      advanceAmount: s.advanceAmount || 0,
      balanceAmount: Math.max(0, (s.totalAmount || 0) - (s.advanceAmount || 0)),
      paymentStatus: (s.advanceAmount || 0) >= (s.totalAmount || 0) && (s.totalAmount || 0) > 0 ? 'paid' : (s.advanceAmount || 0) > 0 ? 'partial' : 'unpaid',
      status: s.status || 'booked',
      bookedAt: s.bookedAt || now,
      retentionDaysLimit: s.retentionDaysLimit || 30,
      events: s.events || [],
      payments: s.payments || [],
      wfolioUrl: s.wfolioUrl || '',
      wfolioPassword: s.wfolioPassword || '',
      wfolioStatus: s.wfolioStatus || 'none',
      rawFilesSizeGb: s.rawFilesSizeGb || 80,
      storageDevice: s.storageDevice || 'SanDisk Extreme SSD 1TB',
      isDataCleared: s.isDataCleared || false,
      deliveredAt: s.deliveredAt,
      dataRetentionDeadline: s.dataRetentionDeadline,
      notes: s.notes || '',
      createdAt: s.createdAt || now,
      updatedAt: now,
    }));

    const merged = [...formatted, ...shoots];
    persistShoots(merged);
  };

  const resetToSampleData = () => {
    persistShoots(INITIAL_SHOOTS);
  };

  // Metrics Calculations
  const metrics = React.useMemo(() => {
    const totalShoots = shoots.length;
    let totalRevenue = 0;
    let totalReceived = 0;
    let cashReceived = 0;
    let digitalReceived = 0;
    let deliveredCount = 0;
    let inEditingCount = 0;
    let upcomingCount = 0;
    let clearedCount = 0;
    let retentionActiveCount = 0;
    let criticalClearanceCount = 0;
    let ownShootsCount = 0;
    let ownShootsRevenue = 0;
    let thirdPartyCount = 0;
    let thirdPartyRevenue = 0;

    const paymentMethodTotals: Record<PaymentMethod, number> = {
      'Cash': 0,
      'UPI': 0,
      'Bank Transfer': 0,
      'Card': 0,
      'Cheque': 0,
      'Other': 0,
    };

    const now = new Date();

    shoots.forEach((shoot) => {
      totalRevenue += shoot.totalAmount;
      totalReceived += shoot.advanceAmount;

      if (shoot.payments && shoot.payments.length > 0) {
        shoot.payments.forEach(p => {
          const method = p.method || 'Cash';
          paymentMethodTotals[method] = (paymentMethodTotals[method] || 0) + p.amount;
          if (method === 'Cash') {
            cashReceived += p.amount;
          } else {
            digitalReceived += p.amount;
          }
        });
      } else if (shoot.advanceAmount > 0) {
        cashReceived += shoot.advanceAmount;
        paymentMethodTotals['Cash'] += shoot.advanceAmount;
      }

      if (shoot.status === 'delivered') deliveredCount++;
      if (shoot.status === 'editing') inEditingCount++;
      if (shoot.status === 'booked' || shoot.status === 'in_progress') upcomingCount++;
      if (shoot.isDataCleared || shoot.status === 'data_cleared') clearedCount++;

      if (shoot.shootType === 'own') {
        ownShootsCount++;
        ownShootsRevenue += shoot.totalAmount;
      } else {
        thirdPartyCount++;
        thirdPartyRevenue += shoot.totalAmount;
      }

      // Retention counts
      if (shoot.deliveredAt && !shoot.isDataCleared) {
        retentionActiveCount++;
        if (shoot.dataRetentionDeadline) {
          const deadline = new Date(shoot.dataRetentionDeadline);
          const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 7) {
            criticalClearanceCount++;
          }
        }
      }
    });

    const totalPending = Math.max(0, totalRevenue - totalReceived);

    return {
      totalShoots,
      totalRevenue,
      totalReceived,
      totalPending,
      cashReceived,
      digitalReceived,
      deliveredCount,
      inEditingCount,
      upcomingCount,
      clearedCount,
      retentionActiveCount,
      criticalClearanceCount,
      ownShootsCount,
      ownShootsRevenue,
      thirdPartyCount,
      thirdPartyRevenue,
      paymentMethodTotals,
    };
  }, [shoots]);

  return (
    <ShootContext.Provider
      value={{
        shoots,
        addShoot,
        updateShoot,
        deleteShoot,
        markAsDelivered,
        markDataCleared,
        addPayment,
        getShootById,
        importShoots,
        isSyncing,
        lastSyncedAt,
        triggerSync,
        theme,
        toggleTheme,
        metrics,
        activeTab,
        setActiveTab,
        selectedShoot,
        setSelectedShoot,
        isCreateModalOpen,
        setIsCreateModalOpen,
        reminderModalShoot,
        setReminderModalShoot,
        resetToSampleData,
      }}
    >
      {children}
    </ShootContext.Provider>
  );
};

export const useShoots = () => {
  const context = useContext(ShootContext);
  if (!context) {
    throw new Error('useShoots must be used within a ShootProvider');
  }
  return context;
};
