# AKHIL 360 — Freelance Photography iOS Studio & Dashboard 📸✨

> **Professional Apple iOS-style shoot registry, Cash & Bank income tracker, 30-day storage clearance engine, wfolio gallery delivery integration, and Apple Calendar auto-sync.**

---

## 🌟 Overview

**AKHIL 360** is a mobile-first business management dashboard built specifically for freelance photographers and creative studios. Designed with Apple iOS Human Interface aesthetics (light and dark mode), it helps photographers track client bookings, manage multi-event timelines, track cash in hand vs. bank deposits, monitor 30-day data retention deadlines before purging local SSD cards, and dispatch 1-click WhatsApp client reminders.

---

## ✨ Key Features

- **📱 Apple iOS Native Aesthetics**: Clean Apple Light Mode with crisp white cards (`#FFFFFF`), light silver background (`#F2F2F7`), dark mode toggle, and iOS 5-tab navigation.
- **📋 Shoot Registry & Classification**: Track **Direct Own Shoots** vs. **3rd-Party Agency Subcontracts** with coordinator info and client contacts.
- **💵 Cash & Payment Breakdown**: Separate tracking for **Cash in Hand**, **UPI (GPay / PhonePe)**, **Bank Transfer**, **Card / POS**, and **Cheque**.
- **⏳ 30-Day Storage & Data Clearance Hub**: Automatic 30-day countdown timer from delivery date with color-coded urgency badges and a safe SSD clearance confirmation log.
- **🖼️ wfolio Gallery Integration**: Dedicated wfolio client gallery URL and PIN linking for instant sharing.
- **💬 1-Click WhatsApp Reminder Templates**: Pre-configured message templates (Gallery Delivery, Balance Payment, 15-Day Hold Notice, 48-Hour Final Purge Warning, Review Request).
- **📅 Apple Calendar Live Auto-Sync**: 1-click instant synchronization (`.ics`) and background subscription support for iPhone, iPad, Apple Watch, and Mac.
- **📊 Revenue Graphs & Analytics**: Interactive monthly revenue progression bar charts, cash vs. digital payment distribution, and category earnings breakdown.
- **🔒 100% Offline & Private**: Zero server dependencies required. All data is saved on your device with 1-click JSON backup export.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS (Apple iOS Design System)
- **Icons**: Lucide React
- **Date Engine**: date-fns
- **Calendar Protocol**: iCalendar (RFC 5545 `.ics`)

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/your-username/akhil-360.git
cd akhil-360
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

---

## 🌐 Free Deployment (GitHub Pages / Vercel)

### Option A: Vercel (1-Click Free Hosting)
1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your `akhil-360` repository and click **Deploy**.

### Option B: GitHub Pages
1. In `vite.config.ts`, set `base: '/akhil-360/'`.
2. Run `npm run build`.
3. In GitHub repo settings, enable **GitHub Pages** from the `dist` or `gh-pages` branch.

---

## 📄 License
MIT License © 2026 AKHIL 360 Photography Studio.
