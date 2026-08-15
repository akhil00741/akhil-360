import React, { useState } from 'react';
import { ShootProvider, useShoots } from './context/ShootContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { ShootRegistryView } from './components/ShootRegistryView';
import { CalendarView } from './components/CalendarView';
import { DataRetentionView } from './components/DataRetentionView';
import { AnalyticsView } from './components/AnalyticsView';
import { ShootModal } from './components/ShootModal';
import { ShootDetailModal } from './components/ShootDetailModal';
import { ReminderTemplateModal } from './components/ReminderTemplateModal';
import { AppleCalendarSyncModal } from './components/AppleCalendarSyncModal';
import { Shoot } from './types/shoot';

const MainApp: React.FC = () => {
  const { 
    activeTab, 
    selectedShoot, 
    setSelectedShoot, 
    isCreateModalOpen, 
    setIsCreateModalOpen, 
    reminderModalShoot, 
    setReminderModalShoot 
  } = useShoots();

  const [shootToEdit, setShootToEdit] = useState<Shoot | null>(null);
  const [isAppleCalendarModalOpen, setIsAppleCalendarModalOpen] = useState(false);

  const handleOpenEdit = (shoot: Shoot) => {
    setSelectedShoot(null);
    setShootToEdit(shoot);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setShootToEdit(null);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] dark:bg-black dark:text-white selection:bg-ios-blue selection:text-white flex flex-col font-sans transition-colors">
      {/* iOS Top Blur Navigation Header */}
      <Header onOpenAppleSync={() => setIsAppleCalendarModalOpen(true)} />

      {/* Main Dynamic View Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-4 sm:px-6 sm:pt-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'registry' && <ShootRegistryView />}
        {activeTab === 'calendar' && <CalendarView onOpenAppleSync={() => setIsAppleCalendarModalOpen(true)} />}
        {activeTab === 'storage' && <DataRetentionView />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>

      {/* iOS Bottom 5-Tab Bar */}
      <BottomNav />

      {/* Create / Edit Shoot Bottom Sheet Modal */}
      {isCreateModalOpen && (
        <ShootModal
          shootToEdit={shootToEdit}
          onClose={handleCloseCreateModal}
        />
      )}

      {/* Detailed Shoot Drawer Modal */}
      {selectedShoot && (
        <ShootDetailModal
          shoot={selectedShoot}
          onClose={() => setSelectedShoot(null)}
          onEdit={handleOpenEdit}
          onOpenReminder={(s) => setReminderModalShoot(s)}
        />
      )}

      {/* 30-Day & Client Reminder Message Templates Modal */}
      {reminderModalShoot && (
        <ReminderTemplateModal
          shoot={reminderModalShoot}
          onClose={() => setReminderModalShoot(null)}
        />
      )}

      {/* Apple Calendar Live Auto-Sync Modal */}
      {isAppleCalendarModalOpen && (
        <AppleCalendarSyncModal
          onClose={() => setIsAppleCalendarModalOpen(false)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ShootProvider>
      <MainApp />
    </ShootProvider>
  );
};

export default App;
