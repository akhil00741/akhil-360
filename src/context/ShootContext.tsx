import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClientContact, Shoot, PaymentRecord, AppTheme, PaymentMethod, PaymentStatus } from '../types/shoot';
import { addDays, format } from 'date-fns';
import { fetchCloudDatabase, saveCloudDatabase, subscribeToCloudDatabase, CloudPayload, cloudDatabasePath, isCloudSyncConfigured } from '../utils/cloudSync';
import { ShootContext } from './ShootContextBase';
import { normalizeOnlinePaymentMethod } from '../utils/paymentMethods';
import { getAutomaticShootStatus } from '../utils/sessionTracking';
import { sortContacts, upsertContactsFromShoots } from '../utils/contactBook';

const STORAGE_SCOPE = cloudDatabasePath.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
const STORAGE_KEY = `akhil_360_shoots_${STORAGE_SCOPE}_v1`;
const DELETED_KEY = `akhil_360_deleted_ids_${STORAGE_SCOPE}_v1`;
const CONTACTS_KEY = `akhil_360_contacts_${STORAGE_SCOPE}_v1`;
const THEME_KEY = 'akhil_360_theme';

const loadStoredContacts = () => {
  try {
    const saved = localStorage.getItem(CONTACTS_KEY);
    if (saved) {
      return sortContacts(JSON.parse(saved) as ClientContact[]);
    }
  } catch (e) {
    console.error('Failed to parse contacts from local storage', e);
  }

  return [];
};

export const ShootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(DELETED_KEY);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {}
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
    return [];
  });

  const [contacts, setContacts] = useState<ClientContact[]>(loadStoredContacts);

  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem(THEME_KEY) as AppTheme) || 'light';
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const shootsRef = useRef<Shoot[]>(shoots);
  shootsRef.current = shoots;
  const contactsRef = useRef<ClientContact[]>(contacts);
  contactsRef.current = contacts;

  const [activeTab, setActiveTab] = useState<'dashboard' | 'registry' | 'contacts' | 'calendar' | 'storage' | 'analytics'>('dashboard');
  const [selectedShoot, setSelectedShoot] = useState<Shoot | null>(null);
  const selectedShootRef = useRef<Shoot | null>(selectedShoot);
  selectedShootRef.current = selectedShoot;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reminderModalShoot, setReminderModalShoot] = useState<Shoot | null>(null);

  const persistContacts = useCallback((nextContacts: ClientContact[]) => {
    const cleanContacts = sortContacts(nextContacts);
    contactsRef.current = cleanContacts;
    setContacts(cleanContacts);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(cleanContacts));
    return cleanContacts;
  }, []);

  const applyCloudUpdate = useCallback((cloudDb: CloudPayload) => {
    const localDeletedIds = new Set(deletedIdsRef.current);
    const cloudDeletedIds = new Set(cloudDb.deletedIds || []);
    const combinedDeleted = new Set([...Array.from(localDeletedIds), ...Array.from(cloudDeletedIds)]);
    setDeletedIds(combinedDeleted);
    deletedIdsRef.current = combinedDeleted;
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(combinedDeleted)));

    const cleanCloudShoots = (cloudDb.shoots || []).filter(s => !combinedDeleted.has(s.id));
    const cloudMap = new Map(cleanCloudShoots.map(s => [s.id, s]));
    const localActiveShoots = shootsRef.current.filter(s => !combinedDeleted.has(s.id));
    const localMap = new Map(localActiveShoots.map(s => [s.id, s]));
    let shouldPublishMergedState = Array.from(localDeletedIds).some(id => !cloudDeletedIds.has(id));

    localActiveShoots.forEach((localShoot) => {
      const cloudShoot = cloudMap.get(localShoot.id);
      if (!cloudShoot || new Date(localShoot.updatedAt || 0) > new Date(cloudShoot.updatedAt || 0)) {
        shouldPublishMergedState = true;
      }
    });

    cleanCloudShoots.forEach(cloudShoot => {
      const localShoot = localMap.get(cloudShoot.id);
      if (!localShoot || (new Date(cloudShoot.updatedAt || 0) > new Date(localShoot.updatedAt || 0))) {
        localMap.set(cloudShoot.id, cloudShoot);
      }
    });

    // Purge any deleted items from localMap
    localMap.forEach((shoot, id) => {
      if (combinedDeleted.has(id)) {
        localMap.delete(id);
      }
    });

    const merged = Array.from(localMap.values()).filter(s => !combinedDeleted.has(s.id));
    setShoots(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    persistContacts(upsertContactsFromShoots(contactsRef.current, merged));
    setLastSyncedAt(new Date());

    if (isCloudSyncConfigured && shouldPublishMergedState) {
      saveCloudDatabase(merged, Array.from(combinedDeleted)).then(() => {
        setLastSyncedAt(new Date());
      });
    }
  }, [persistContacts]);

  const pullCloudUpdate = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsSyncing(true);
    try {
      const cloudDb = await fetchCloudDatabase();
      if (cloudDb) {
        applyCloudUpdate(cloudDb);
      }
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      if (showSpinner) setIsSyncing(false);
    }
  }, [applyCloudUpdate]);

  // Sync to Cloud function with Shared Tombstone Protection
  const triggerSync = useCallback(async () => {
    await pullCloudUpdate(true);
  }, [pullCloudUpdate]);

  // Subscribe to real-time Firebase updates
  useEffect(() => {
    triggerSync();

    const unsubscribe = subscribeToCloudDatabase((cloudDb) => {
      applyCloudUpdate(cloudDb);
    });

    const handleFocus = () => {
      triggerSync();
    };

    const cloudPullInterval = window.setInterval(() => {
      pullCloudUpdate(false);
    }, 15_000);

    window.addEventListener('focus', handleFocus);
    return () => {
      unsubscribe();
      window.clearInterval(cloudPullInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [triggerSync, applyCloudUpdate, pullCloudUpdate]);

  const applyAutomaticStatuses = useCallback((sourceShoots: Shoot[], nowMs = Date.now()) => {
    let changed = false;
    const syncedShoots = sourceShoots.map((shoot) => {
      const nextStatus = getAutomaticShootStatus(shoot, nowMs);

      if (nextStatus === shoot.status) {
        return shoot;
      }

      changed = true;
      return {
        ...shoot,
        status: nextStatus,
        updatedAt: new Date(nowMs).toISOString(),
      };
    });

    return { shoots: syncedShoots, changed };
  }, []);

  // Persist to local storage and sync to cloud
  const persistShoots = useCallback((newShoots: Shoot[]) => {
    const { shoots: autoSyncedShoots } = applyAutomaticStatuses(newShoots);
    const cleanShoots = autoSyncedShoots.filter(s => !deletedIdsRef.current.has(s.id));
    const cleanContacts = upsertContactsFromShoots(contactsRef.current, cleanShoots);
    setShoots(cleanShoots);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanShoots));
    persistContacts(cleanContacts);
    saveCloudDatabase(cleanShoots, Array.from(deletedIdsRef.current)).then(() => {
      setLastSyncedAt(new Date());
    });
    return cleanShoots;
  }, [applyAutomaticStatuses, persistContacts]);

  const syncAutomaticStatuses = useCallback(() => {
    const { shoots: autoSyncedShoots, changed } = applyAutomaticStatuses(
      shootsRef.current.filter(s => !deletedIdsRef.current.has(s.id)),
    );

    if (!changed) return;

    persistShoots(autoSyncedShoots);

    const currentSelectedShoot = selectedShootRef.current;
    if (currentSelectedShoot) {
      setSelectedShoot(autoSyncedShoots.find((s) => s.id === currentSelectedShoot.id) || null);
    }
  }, [applyAutomaticStatuses, persistShoots]);

  useEffect(() => {
    syncAutomaticStatuses();

    const interval = window.setInterval(syncAutomaticStatuses, 60_000);
    window.addEventListener('focus', syncAutomaticStatuses);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', syncAutomaticStatuses);
    };
  }, [syncAutomaticStatuses]);

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

    const primaryPaymentMethod = normalizeOnlinePaymentMethod(shootData.primaryPaymentMethod);

    const newShoot: Shoot = {
      ...shootData,
      primaryPaymentMethod,
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
          method: primaryPaymentMethod,
          notes: 'Initial online advance deposit',
        }
      ] : [],
    };

    const updatedShoots = [newShoot, ...shootsRef.current.filter(s => !deletedIdsRef.current.has(s.id))];
    persistShoots(updatedShoots);
    return newShoot;
  };

  const updateShoot = (id: string, updates: Partial<Shoot>) => {
    const updatedShoots = shootsRef.current.map((s) => {
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

    const persistedShoots = persistShoots(updatedShoots);

    if (selectedShoot && selectedShoot.id === id) {
      setSelectedShoot(persistedShoots.find((s) => s.id === id) || null);
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
    const updatedShoots = shootsRef.current.filter((s) => s.id !== id && !newDeleted.has(s.id));
    setShoots(updatedShoots);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedShoots));

    if (selectedShoot?.id === id) {
      setSelectedShoot(null);
    }

    // 3. Immediately publish the tombstone so other devices remove it too.
    setIsSyncing(true);
    try {
      await saveCloudDatabase(updatedShoots, Array.from(newDeleted));
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

  const markDataCleared = (id: string, _notes?: string) => {
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
      method: normalizeOnlinePaymentMethod(payment.method),
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
      primaryPaymentMethod: normalizeOnlinePaymentMethod(s.primaryPaymentMethod),
      payments: (s.payments || []).map((payment) => ({
        ...payment,
        method: normalizeOnlinePaymentMethod(payment.method),
      })),
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

    const merged = [...formatted, ...shootsRef.current.filter(s => !deletedIdsRef.current.has(s.id))];
    persistShoots(merged);
  };

  const clearAllData = async () => {
    const nextDeleted = new Set([
      ...Array.from(deletedIdsRef.current),
      ...shootsRef.current.map((shoot) => shoot.id),
    ]);

    setDeletedIds(nextDeleted);
    deletedIdsRef.current = nextDeleted;
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(nextDeleted)));

    setShoots([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    persistContacts([]);

    if (selectedShootRef.current) {
      setSelectedShoot(null);
    }

    setIsSyncing(true);
    try {
      await saveCloudDatabase([], Array.from(nextDeleted));
      setLastSyncedAt(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  // Metrics Calculations
  const metrics = React.useMemo(() => {
    const totalShoots = shoots.length;
    let totalRevenue = 0;
    let totalReceived = 0;
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
          const method = normalizeOnlinePaymentMethod(p.method);
          paymentMethodTotals[method] = (paymentMethodTotals[method] || 0) + p.amount;
          digitalReceived += p.amount;
        });
      } else if (shoot.advanceAmount > 0) {
        const method = normalizeOnlinePaymentMethod(shoot.primaryPaymentMethod);
        digitalReceived += shoot.advanceAmount;
        paymentMethodTotals[method] += shoot.advanceAmount;
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
        contacts,
        addShoot,
        updateShoot,
        deleteShoot,
        markAsDelivered,
        markDataCleared,
        addPayment,
        getShootById,
        importShoots,
        clearAllData,
        isSyncing,
        isCloudEnabled: isCloudSyncConfigured,
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
      }}
    >
      {children}
    </ShootContext.Provider>
  );
};
