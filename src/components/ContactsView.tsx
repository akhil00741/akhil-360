import React, { useMemo, useState } from 'react';
import { AtSign, Check, Copy, Download, Mail, MessageSquare, Phone, Search, UserPlus, UserRound } from 'lucide-react';
import { useShoots } from '../context/useShoots';
import { contactsToVCard } from '../utils/contactBook';
import { getWhatsAppLink } from '../utils/helpers';
import type { ClientContact } from '../types/shoot';

const copyToClipboard = async (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

const getSafeFileName = (value: string) => {
  return value.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'Contact';
};

const saveVCardFile = async (targetContacts: ClientContact[], filename: string) => {
  const vcard = contactsToVCard(targetContacts);
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const file = new File([blob], filename, { type: 'text/vcard' });
  const shareData: ShareData = {
    files: [file],
    title: filename,
    text: targetContacts.length === 1 ? `Save ${targetContacts[0].name} to Contacts` : 'Save AKHIL 360 contacts',
  };

  if (navigator.share && navigator.canShare?.(shareData)) {
    await navigator.share(shareData);
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const ContactsView: React.FC = () => {
  const { contacts, setIsCreateModalOpen } = useShoots();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedContactId, setSavedContactId] = useState<string | null>(null);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return contacts;

    return contacts.filter((contact) => [
      contact.name,
      contact.phone,
      contact.email,
      contact.instagram,
      contact.lastShootTitle,
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [contacts, searchQuery]);

  const handleCopy = async (id: string, text: string) => {
    await copyToClipboard(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => current === id ? null : current), 1400);
  };

  const handleSaveContactCard = async (contact: ClientContact) => {
    try {
      await saveVCardFile([contact], `AKHIL_360_${getSafeFileName(contact.name || contact.phone)}.vcf`);
      setSavedContactId(contact.id);
      window.setTimeout(() => setSavedContactId((current) => current === contact.id ? null : current), 1800);
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') {
        console.error('Unable to prepare contact card', error);
      }
    }
  };

  const handleExportVCard = async () => {
    try {
      await saveVCardFile(filteredContacts, `AKHIL_360_Contacts_${new Date().toISOString().split('T')[0]}.vcf`);
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') {
        console.error('Unable to export contact cards', error);
      }
    }
  };

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">
            Client Contact Book
          </h2>
          <p className="text-xs font-medium text-zinc-500">
            Automatically saved from every shoot you create or edit.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportVCard}
            disabled={filteredContacts.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-extrabold text-zinc-800 shadow-xs transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-ios-blue" />
            <span>Export vCard</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#B83A08] px-4 text-xs font-extrabold text-white shadow-xs transition-colors hover:bg-[#923006]"
          >
            <UserRound className="h-4 w-4" />
            <span>New Shoot</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search contacts by name, phone, email, Instagram, or shoot..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm font-semibold text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-ios-blue focus:bg-white"
          />
        </div>
      </div>

      {filteredContacts.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filteredContacts.map((contact) => {
            const copyBlock = [
              `Client: ${contact.name}`,
              contact.phone ? `Phone: ${contact.phone}` : '',
              contact.email ? `Email: ${contact.email}` : '',
              contact.instagram ? `Instagram: ${contact.instagram}` : '',
            ].filter(Boolean).join('\n');

            return (
              <article key={contact.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-56 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-ios-blue ring-1 ring-blue-100">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-extrabold text-zinc-950">{contact.name}</h3>
                        <p className="text-[11px] font-semibold text-zinc-500">
                          {contact.shootCount} shoot{contact.shootCount === 1 ? '' : 's'}
                          {contact.lastShootTitle ? ` • Last: ${contact.lastShootTitle}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveContactCard(contact)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#B83A08] px-3 text-xs font-extrabold text-white shadow-xs transition-colors hover:bg-[#923006]"
                      aria-label={`Save ${contact.name} as an iPhone contact card`}
                    >
                      {savedContactId === contact.id ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                      <span>{savedContactId === contact.id ? 'Card Ready' : 'Save to iPhone'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(`all-${contact.id}`, copyBlock)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-800 transition-colors hover:bg-emerald-100"
                      aria-label={`Copy all contact information for ${contact.name}`}
                    >
                      {copiedId === `all-${contact.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedId === `all-${contact.id}` ? 'Copied' : 'Copy All'}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {contact.phone && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopy(`phone-${contact.id}`, contact.phone)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-800 transition-colors hover:bg-white"
                      >
                        <Phone className="h-3.5 w-3.5 text-ios-blue" />
                        <span>{contact.phone}</span>
                        {copiedId === `phone-${contact.id}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
                      </button>
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-zinc-900 px-3 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>Call</span>
                      </a>
                      <a
                        href={getWhatsAppLink(contact.phone, `Hi ${contact.name}, regarding our shoot with AKHIL 360...`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-500"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </>
                  )}

                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-ios-blue transition-colors hover:bg-blue-100"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>{contact.email}</span>
                    </a>
                  )}

                  {contact.instagram && (
                    <button
                      type="button"
                      onClick={() => handleCopy(`instagram-${contact.id}`, contact.instagram || '')}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-100"
                    >
                      <AtSign className="h-3.5 w-3.5" />
                      <span>{contact.instagram}</span>
                      {copiedId === `instagram-${contact.id}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-purple-400" />}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-ios-blue ring-1 ring-blue-100">
            <UserRound className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-extrabold text-zinc-900">No contacts saved yet</h3>
          <p className="mx-auto mt-1 max-w-md text-xs font-medium leading-relaxed text-zinc-500">
            Create your first shoot with client phone, email, or Instagram, and the client will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
};
