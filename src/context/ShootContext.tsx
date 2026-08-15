import React, { createContext, useContext, useState, useEffect } from 'react';
import { Shoot, PaymentRecord, AppTheme, PaymentMethod } from '../types/shoot';
import { INITIAL_SHOOTS } from '../data/sampleData';
import { addDays, format } from 'date-fns';

const STORAGE_KEY = 'akhil_360_shoots_prod_v1';
const THEME_KEY = 'akhil_360_theme';

interface ShootContextType {
  shoots: Shoot[];
  addShoot: (shoot: Omit<Shoot, 'id' | 'createdAt' | 'updatedAt' | 'balanceAmount'>) => Shoot;
  updateShoot: (id: string, updates: Partial<Shoot>) => void;
  deleteShoot: (id: string) => void;
  markAsDelivered: (id: string, deliveredAtDate?: string, wfolioUrl?: string) => void;
  markDataCleared: (id: string, notes?: string) => void;
  addPayment: (shootId: string, payment: Omit<PaymentRecord, 'id'>) => void;
  getShootById: (id: string) => Shoot | undefined;
  importShoots: (newShoots: Partial<Shoot>[]) => void;
  
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
    criticalClearanceCount: number; // < 7 days
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
  const [shoots, setShoots] = useState<Shoot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse shoots from local storage', e);
    }
    return INITIAL_SHOOTS;
  });

  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return (saved as AppTheme) || 'light';
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'registry' | 'calendar' | 'storage' | 'analytics'>('dashboard');
  const [selectedShoot, setSelectedShoot] = useState<Shoot | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [reminderModalShoot, setReminderModalShoot] = useState<Shoot | null>(null);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync shoots to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shoots));
    } catch (e) {
      console.error('Failed to save shoots to local storage', e);
    }
  }, [shoots]);

  // Sync selected shoot
  useEffect(() => {
    if (selectedShoot) {
      const updated = shoots.find(s => s.id === selectedShoot.id);
      if (updated) {
        setSelectedShoot(updated);
      }
    }
  }, [shoots]);

  const addShoot = (shootData: Omit<Shoot, 'id' | 'createdAt' | 'updatedAt' | 'balanceAmount'>): Shoot => {
    const now = new Date();
    const id = `shoot-${Date.now()}`;
    const balanceAmount = Math.max(0, shootData.totalAmount - (shootData.advanceAmount || 0));
    
    let paymentStatus: Shoot['paymentStatus'] = 'unpaid';
    if (shootData.advanceAmount >= shootData.totalAmount && shootData.totalAmount > 0) {
      paymentStatus = 'paid';
    } else if (shootData.advanceAmount > 0) {
      paymentStatus = 'partial';
    }

    const defaultMethod = shootData.primaryPaymentMethod || 'Cash';

    const newShoot: Shoot = {
      ...shootData,
      id,
      balanceAmount,
      paymentStatus,
      primaryPaymentMethod: defaultMethod,
      payments: shootData.payments || (shootData.advanceAmount > 0 ? [{
        id: `p-${Date.now()}`,
        amount: shootData.advanceAmount,
        date: shootData.bookedAt || format(now, 'yyyy-MM-dd'),
        method: defaultMethod,
        notes: 'Initial advance',
      }] : []),
      retentionDaysLimit: shootData.retentionDaysLimit || 30,
      isDataCleared: false,
      wfolioStatus: shootData.wfolioUrl ? (shootData.status === 'delivered' ? 'delivered' : 'published') : 'none',
      createdAt: format(now, 'yyyy-MM-dd HH:mm:ss'),
      updatedAt: format(now, 'yyyy-MM-dd HH:mm:ss'),
    };

    if (newShoot.status === 'delivered' && !newShoot.deliveredAt) {
      newShoot.deliveredAt = format(now, 'yyyy-MM-dd');
      newShoot.dataRetentionDeadline = format(addDays(now, newShoot.retentionDaysLimit), 'yyyy-MM-dd');
    }

    setShoots(prev => [newShoot, ...prev]);
    return newShoot;
  };

  const updateShoot = (id: string, updates: Partial<Shoot>) => {
    setShoots(prev => prev.map(shoot => {
      if (shoot.id !== id) return shoot;

      const merged = { ...shoot, ...updates, updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss') };
      
      if ('totalAmount' in updates || 'advanceAmount' in updates || 'payments' in updates) {
        const totalPaid = merged.payments?.reduce((sum, p) => sum + p.amount, 0) || merged.advanceAmount || 0;
        merged.advanceAmount = totalPaid;
        merged.balanceAmount = Math.max(0, merged.totalAmount - totalPaid);
        if (merged.balanceAmount === 0 && merged.totalAmount > 0) {
          merged.paymentStatus = 'paid';
        } else if (totalPaid > 0) {
          merged.paymentStatus = 'partial';
        } else {
          merged.paymentStatus = 'unpaid';
        }
      }

      if (updates.status === 'delivered' && !shoot.deliveredAt && !updates.deliveredAt) {
        const delDate = format(new Date(), 'yyyy-MM-dd');
        merged.deliveredAt = delDate;
        merged.dataRetentionDeadline = format(addDays(new Date(), merged.retentionDaysLimit || 30), 'yyyy-MM-dd');
      }

      return merged;
    }));
  };

  const deleteShoot = (id: string) => {
    setShoots(prev => prev.filter(s => s.id !== id));
    if (selectedShoot?.id === id) {
      setSelectedShoot(null);
    }
  };

  const markAsDelivered = (id: string, deliveredAtDate?: string, wfolioUrl?: string) => {
    const delDate = deliveredAtDate || format(new Date(), 'yyyy-MM-dd');
    const deadline = format(addDays(new Date(delDate), 30), 'yyyy-MM-dd');
    
    updateShoot(id, {
      status: 'delivered',
      deliveredAt: delDate,
      dataRetentionDeadline: deadline,
      ...(wfolioUrl ? { wfolioUrl, wfolioStatus: 'delivered' } : {}),
    });
  };

  const markDataCleared = (id: string, notes?: string) => {
    const clearedDate = format(new Date(), 'yyyy-MM-dd');
    updateShoot(id, {
      status: 'data_cleared',
      isDataCleared: true,
      dataClearedAt: clearedDate,
      storageDevice: notes ? `${notes} (Cleared)` : 'Cleared from local storage',
    });
  };

  const addPayment = (shootId: string, payment: Omit<PaymentRecord, 'id'>) => {
    const shoot = shoots.find(s => s.id === shootId);
    if (!shoot) return;

    const newRecord: PaymentRecord = {
      ...payment,
      id: `pay-${Date.now()}`,
    };

    const newPayments = [...(shoot.payments || []), newRecord];
    const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, shoot.totalAmount - totalPaid);

    updateShoot(shootId, {
      payments: newPayments,
      advanceAmount: totalPaid,
      balanceAmount: balance,
      paymentStatus: balance === 0 ? 'paid' : 'partial',
    });
  };

  const importShoots = (newShoots: Partial<Shoot>[]) => {
    const prepared: Shoot[] = newShoots.map((s, idx) => {
      const now = new Date();
      const totalAmount = s.totalAmount || 30000;
      const advanceAmount = s.advanceAmount || 0;
      return {
        id: `shoot-import-${Date.now()}-${idx}`,
        title: s.title || `Shoot ${idx + 1}`,
        category: s.category || 'Wedding',
        shootType: s.shootType || 'own',
        clientName: s.clientName || 'Imported Client',
        clientPhone: s.clientPhone || '+91 ',
        location: s.location || 'Location TBD',
        primaryDate: s.primaryDate || format(now, 'yyyy-MM-dd'),
        events: s.events || [],
        totalAmount,
        advanceAmount,
        balanceAmount: Math.max(0, totalAmount - advanceAmount),
        paymentStatus: advanceAmount >= totalAmount ? 'paid' : advanceAmount > 0 ? 'partial' : 'unpaid',
        primaryPaymentMethod: 'Cash',
        payments: advanceAmount > 0 ? [{ id: `pay-init-${idx}`, amount: advanceAmount, date: format(now, 'yyyy-MM-dd'), method: 'Cash' }] : [],
        status: s.status || 'booked',
        bookedAt: format(now, 'yyyy-MM-dd'),
        retentionDaysLimit: 30,
        isDataCleared: false,
        wfolioStatus: 'none',
        createdAt: format(now, 'yyyy-MM-dd HH:mm:ss'),
        updatedAt: format(now, 'yyyy-MM-dd HH:mm:ss'),
      };
    });

    setShoots(prev => [...prepared, ...prev]);
  };

  const getShootById = (id: string) => {
    return shoots.find(s => s.id === id);
  };

  const resetToSampleData = () => {
    setShoots(INITIAL_SHOOTS);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Compute live metrics
  const totalShoots = shoots.length;
  const totalRevenue = shoots.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalReceived = shoots.reduce((sum, s) => sum + (s.advanceAmount || 0), 0);
  const totalPending = shoots.reduce((sum, s) => sum + (s.balanceAmount || 0), 0);

  // Compute Cash vs Digital payments
  const paymentMethodTotals: Record<PaymentMethod, number> = {
    'Cash': 0,
    'UPI': 0,
    'Bank Transfer': 0,
    'Card': 0,
    'Cheque': 0,
    'Other': 0,
  };

  shoots.forEach(s => {
    if (s.payments && s.payments.length > 0) {
      s.payments.forEach(p => {
        const method = p.method || 'Cash';
        paymentMethodTotals[method] = (paymentMethodTotals[method] || 0) + p.amount;
      });
    } else if (s.advanceAmount > 0) {
      const method = s.primaryPaymentMethod || 'Cash';
      paymentMethodTotals[method] = (paymentMethodTotals[method] || 0) + s.advanceAmount;
    }
  });

  const cashReceived = paymentMethodTotals['Cash'] || 0;
  const digitalReceived = totalReceived - cashReceived;

  const deliveredCount = shoots.filter(s => s.status === 'delivered').length;
  const inEditingCount = shoots.filter(s => s.status === 'editing').length;
  const upcomingCount = shoots.filter(s => s.status === 'booked' || s.status === 'in_progress').length;
  const clearedCount = shoots.filter(s => s.isDataCleared).length;

  const retentionActiveCount = shoots.filter(s => s.deliveredAt && !s.isDataCleared).length;
  
  const today = new Date();
  const criticalClearanceCount = shoots.filter(s => {
    if (!s.deliveredAt || s.isDataCleared || !s.dataRetentionDeadline) return false;
    const diff = (new Date(s.dataRetentionDeadline).getTime() - today.getTime()) / (1000 * 3600 * 24);
    return diff <= 7;
  }).length;

  const ownShoots = shoots.filter(s => s.shootType === 'own');
  const thirdPartyShoots = shoots.filter(s => s.shootType === 'third_party');

  const ownShootsCount = ownShoots.length;
  const ownShootsRevenue = ownShoots.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const thirdPartyCount = thirdPartyShoots.length;
  const thirdPartyRevenue = thirdPartyShoots.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const metrics = {
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
