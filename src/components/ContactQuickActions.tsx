import React, { useMemo, useState } from 'react';
import { AtSign, Check, Copy, Mail, MessageSquare, Phone } from 'lucide-react';
import { Shoot } from '../types/shoot';
import { getWhatsAppLink } from '../utils/helpers';

interface ContactQuickActionsProps {
  shoot: Shoot;
  compact?: boolean;
  showQuickLinks?: boolean;
}

const copyToClipboard = async (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

export const ContactQuickActions: React.FC<ContactQuickActionsProps> = ({
  shoot,
  compact = false,
  showQuickLinks = false,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const contacts = useMemo(() => [
    { key: 'phone', label: 'Phone', value: shoot.clientPhone, icon: Phone },
    { key: 'email', label: 'Email', value: shoot.clientEmail, icon: Mail },
    { key: 'instagram', label: 'Instagram', value: shoot.clientInstagram, icon: AtSign },
  ].filter(item => item.value?.trim()), [shoot.clientEmail, shoot.clientInstagram, shoot.clientPhone]);

  const copyAllText = useMemo(() => [
    `Client: ${shoot.clientName}`,
    shoot.clientPhone ? `Phone: ${shoot.clientPhone}` : '',
    shoot.clientEmail ? `Email: ${shoot.clientEmail}` : '',
    shoot.clientInstagram ? `Instagram: ${shoot.clientInstagram}` : '',
  ].filter(Boolean).join('\n'), [shoot.clientEmail, shoot.clientInstagram, shoot.clientName, shoot.clientPhone]);

  const handleCopy = async (key: string, value: string) => {
    await copyToClipboard(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((current) => current === key ? null : current), 1400);
  };

  if (contacts.length === 0) {
    return (
      <span className="text-[11px] text-zinc-400 font-semibold">
        No contact info saved
      </span>
    );
  }

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-2">
        {contacts.map(({ key, label, value, icon: Icon }) => {
          const isCopied = copiedKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleCopy(key, value || '')}
              aria-label={`Copy ${label}: ${value}`}
              title={`Copy ${label}`}
              className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-800 shadow-2xs transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ios-blue/25 ${
                compact ? 'max-w-full sm:max-w-[210px]' : 'max-w-full'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-ios-blue shrink-0" />
              <span className="truncate">
                {compact ? value : `${label}: ${value}`}
              </span>
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => handleCopy('all', copyAllText)}
          aria-label={`Copy all contact information for ${shoot.clientName}`}
          title="Copy all contact information"
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 text-xs font-extrabold text-emerald-800 shadow-2xs transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
        >
          {copiedKey === 'all' ? (
            <Check className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Copy className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{copiedKey === 'all' ? 'Copied' : 'Copy All'}</span>
        </button>
      </div>

      {showQuickLinks && (
        <div className="flex flex-wrap items-center gap-2">
          {shoot.clientPhone && (
            <>
              <a
                href={`tel:${shoot.clientPhone}`}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 px-3 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.98]"
                title="Call client"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
              <a
                href={getWhatsAppLink(shoot.clientPhone, `Hi ${shoot.clientName}, regarding our shoot with AKHIL 360...`)}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-glow-green transition-all active:scale-[0.98]"
                title="WhatsApp client"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </>
          )}

          {shoot.clientEmail && (
            <a
              href={`mailto:${shoot.clientEmail}?subject=Photos & Updates: ${encodeURIComponent(shoot.title)} - AKHIL 360&body=Hi ${encodeURIComponent(shoot.clientName)},%0D%0A%0D%0ARegarding our photography shoot "${encodeURIComponent(shoot.title)}"...`}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-blue-50 hover:bg-blue-100 px-3 py-2 text-xs font-bold text-ios-blue border border-blue-200 shadow-2xs transition-all active:scale-[0.98]"
              title="Email client"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};
