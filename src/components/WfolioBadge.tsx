import React, { useMemo, useState } from 'react';
import { AlertCircle, Check, Copy, ExternalLink, Globe, KeyRound } from 'lucide-react';

interface WfolioBadgeProps {
  url?: string;
  password?: string;
  status?: string;
  clientName?: string;
  compact?: boolean;
}

export const WfolioBadge: React.FC<WfolioBadgeProps> = ({
  url,
  password,
  status,
  clientName,
  compact = false,
}) => {
  const [copied, setCopied] = useState<'link' | 'details' | null>(null);
  const gallery = useMemo(() => getGalleryUrlState(url), [url]);
  const statusMeta = getStatusMeta(status, Boolean(gallery.displayUrl));
  const shareText = useMemo(() => {
    const lines = [
      `wfolio gallery${clientName ? ` for ${clientName}` : ''}`,
      `Link: ${gallery.displayUrl || 'Not added'}`,
    ];

    if (password) {
      lines.push(`PIN: ${password}`);
    }

    return lines.join('\n');
  }, [clientName, gallery.displayUrl, password]);

  if (!gallery.displayUrl) {
    if (compact) {
      return (
        <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-500">
          <Globe className="h-3.5 w-3.5" />
          <span>No wfolio link</span>
        </span>
      );
    }

    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-500 ring-1 ring-zinc-200">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-zinc-900">No wfolio gallery added</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Add the client gallery link and PIN when delivery is ready.
          </p>
        </div>
      </div>
    );
  }

  const handleCopy = async (e: React.MouseEvent, kind: 'link' | 'details') => {
    e.stopPropagation();
    await writeToClipboard(kind === 'link' ? gallery.displayUrl : shareText);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!gallery.isValid) return;
    window.open(gallery.openUrl, '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        disabled={!gallery.isValid}
        title={gallery.isValid ? 'Open wfolio Client Gallery' : 'Invalid wfolio link'}
        aria-label={gallery.isValid ? 'Open wfolio client gallery' : 'Invalid wfolio client gallery link'}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 text-xs font-semibold text-indigo-700 shadow-xs transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-rose-50 disabled:text-rose-700"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>wfolio Gallery</span>
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-indigo-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
            <Globe className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-zinc-950">wfolio Client Gallery</span>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusMeta.className}`}>
                {statusMeta.label}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              {clientName ? `${clientName} delivery link` : 'Client delivery link'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={(event) => void handleCopy(event, 'details')}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
            aria-label="Copy wfolio gallery link and PIN"
          >
            {copied === 'details' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied === 'details' ? 'Copied' : 'Copy Details'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpen}
            disabled={!gallery.isValid}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white shadow-xs transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
            aria-label={gallery.isValid ? 'Open wfolio client gallery' : 'Invalid wfolio client gallery link'}
          >
            <span>Open Gallery</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Gallery Link</p>
          {gallery.isValid ? (
            <a
              href={gallery.openUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="mt-1 block break-all text-sm font-semibold text-indigo-700 underline-offset-2 hover:text-indigo-600 hover:underline"
            >
              {gallery.displayUrl}
            </a>
          ) : (
            <p className="mt-1 break-all text-sm font-semibold text-rose-700">{gallery.displayUrl}</p>
          )}
        </div>

        {password && (
          <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2">
            <KeyRound className="h-4 w-4 text-zinc-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">PIN</p>
              <code className="font-mono text-sm font-bold text-zinc-950">{password}</code>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={(event) => void handleCopy(event, 'link')}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-white"
          aria-label="Copy only the wfolio gallery link"
        >
          {copied === 'link' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied === 'link' ? 'Link Copied' : 'Copy Link Only'}</span>
        </button>
      </div>

      {!gallery.isValid && (
        <div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>This gallery link is not a valid web address. You can still copy it, but opening is disabled until it is corrected.</p>
        </div>
      )}
    </div>
  );
};

const getGalleryUrlState = (rawUrl?: string) => {
  const displayUrl = rawUrl?.trim() || '';

  if (!displayUrl) {
    return {
      displayUrl: '',
      openUrl: '',
      isValid: false,
    };
  }

  const hasProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(displayUrl);
  const candidate = hasProtocol ? displayUrl : `https://${displayUrl}`;

  try {
    const parsed = new URL(candidate);

    return {
      displayUrl,
      openUrl: parsed.href,
      isValid: parsed.protocol === 'http:' || parsed.protocol === 'https:',
    };
  } catch {
    return {
      displayUrl,
      openUrl: '',
      isValid: false,
    };
  }
};

const getStatusMeta = (status: string | undefined, hasUrl: boolean) => {
  const normalizedStatus = status || (hasUrl ? 'published' : 'none');

  switch (normalizedStatus) {
    case 'delivered':
      return {
        label: 'Delivered',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      };
    case 'pending':
      return {
        label: 'Pending',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
      };
    case 'published':
      return {
        label: 'Live',
        className: 'border-cyan-200 bg-cyan-50 text-cyan-800',
      };
    default:
      return {
        label: hasUrl ? 'Saved' : 'Not Added',
        className: 'border-zinc-200 bg-zinc-50 text-zinc-600',
      };
  }
};

const writeToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
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
