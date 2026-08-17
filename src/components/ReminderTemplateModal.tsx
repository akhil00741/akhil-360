import React, { useState } from 'react';
import { Shoot } from '../types/shoot';
import { REMINDER_TEMPLATES, getWhatsAppLink } from '../utils/helpers';
import { X, Send, Copy, Check, MessageSquare, Sparkles } from 'lucide-react';

interface ReminderTemplateModalProps {
  shoot: Shoot | null;
  onClose: () => void;
}

export const ReminderTemplateModal: React.FC<ReminderTemplateModalProps> = ({ shoot, onClose }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('delivery_ready');
  const [copied, setCopied] = useState(false);

  if (!shoot) return null;

  const currentTemplate = REMINDER_TEMPLATES.find(t => t.id === selectedTemplateId) || REMINDER_TEMPLATES[0];
  const generatedMessage = currentTemplate.template(shoot);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!shoot.clientPhone) {
      alert('Client phone number not found. Please edit the shoot to add a phone number.');
      return;
    }
    const link = getWhatsAppLink(shoot.clientPhone, generatedMessage);
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/35 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-white border border-zinc-200/90 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col animate-sheet-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grabber Pill */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-300 mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">
                1-Click WhatsApp Message Templates
              </h2>
              <p className="text-xs text-zinc-500 font-medium">Auto-formatted for {shoot.clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-130px)]">
          
          {/* Template Selection Pills */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              Select Message Scenario
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REMINDER_TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                        : 'bg-[#F8F9FB] border-zinc-200 text-zinc-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{tmpl.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isSelected ? 'bg-emerald-200 text-emerald-900' : 'bg-zinc-200 text-zinc-600'
                      }`}>
                        {tmpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">{tmpl.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generated Message Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live WhatsApp Message Preview (Rupees ₹)</span>
              </label>
              <button
                onClick={handleCopy}
                className="text-xs font-bold text-ios-blue hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-zinc-200 font-sans text-xs sm:text-sm text-zinc-800 leading-relaxed whitespace-pre-line shadow-2xs">
              {generatedMessage}
            </div>
          </div>

          {/* Client Target Details */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-zinc-500">Sending to: </span>
              <strong className="text-zinc-900">{shoot.clientName}</strong>
              <span className="text-zinc-500 font-mono ml-2">({shoot.clientPhone || 'No phone'})</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-white flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Message'}</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-green transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Open in WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
