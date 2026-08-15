import React, { useState } from 'react';
import { Shoot } from '../types/shoot';
import { REMINDER_TEMPLATES, getWhatsAppLink, calculateRetentionStatus } from '../utils/helpers';
import { X, Send, Copy, Check, MessageSquare, AlertTriangle } from 'lucide-react';

interface ReminderTemplateModalProps {
  shoot: Shoot | null;
  onClose: () => void;
}

export const ReminderTemplateModal: React.FC<ReminderTemplateModalProps> = ({ shoot, onClose }) => {
  if (!shoot) return null;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('delivery_ready');
  const [customText, setCustomText] = useState<string>(() => {
    const defaultTmpl = REMINDER_TEMPLATES[0];
    return defaultTmpl ? defaultTmpl.template(shoot) : '';
  });
  const [copied, setCopied] = useState(false);

  const retention = calculateRetentionStatus(shoot);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = REMINDER_TEMPLATES.find(t => t.id === id);
    if (tmpl) {
      setCustomText(tmpl.template(shoot));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!shoot.clientPhone) {
      alert('Please add client phone number first.');
      return;
    }
    const link = getWhatsAppLink(shoot.clientPhone, customText);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
      <div 
        className="w-full max-w-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col animate-sheet-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
                Client Reminder Templates
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                To: <span className="text-zinc-900 dark:text-white font-bold">{shoot.clientName}</span> ({shoot.clientPhone || 'No phone'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Storage Alert Notice if applicable */}
          {retention && (
            <div className={`p-3 rounded-xl border flex items-center justify-between ${retention.badgeColor}`}>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold">30-Day Policy:</span>
                <span className="text-xs font-medium">{retention.badgeText} (Deadline: {retention.deadlineFormatted})</span>
              </div>
              <span className="text-[11px] font-mono font-bold">{retention.progressPercent}%</span>
            </div>
          )}

          {/* Template Selector Pills */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              Select Message Scenario
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REMINDER_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className={`p-2.5 text-left rounded-xl border transition-all text-xs font-semibold ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-ios-blue/20 border-ios-blue text-ios-blue dark:text-white shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono font-bold border border-zinc-200 dark:border-zinc-700">
                        {tmpl.badge}
                      </span>
                    </div>
                    <p className="line-clamp-1 font-bold">{tmpl.title}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Message Preview & Customize
              </label>
              <span className="text-[11px] text-zinc-400 font-medium">Auto-filled with client data</span>
            </div>
            <textarea
              rows={8}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-ios-blue font-sans leading-relaxed resize-none shadow-xs"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow-green transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
