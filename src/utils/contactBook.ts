import { ClientContact, Shoot } from '../types/shoot';

const normalizeText = (value?: string) => value?.trim() || '';
const normalizeComparable = (value?: string) => normalizeText(value).toLowerCase();
const normalizePhone = (value?: string) => normalizeText(value).replace(/[^\d+]/g, '');

const getContactKey = (contact: Pick<ClientContact, 'name' | 'phone' | 'email' | 'instagram'>) => {
  const phone = normalizePhone(contact.phone);
  if (phone) return `phone:${phone}`;

  const email = normalizeComparable(contact.email);
  if (email) return `email:${email}`;

  const instagram = normalizeComparable(contact.instagram);
  if (instagram) return `instagram:${instagram.replace(/^@/, '')}`;

  return `name:${normalizeComparable(contact.name)}`;
};

const isUsableContactShoot = (shoot: Shoot) => {
  return Boolean(
    normalizeText(shoot.clientName) ||
    normalizeText(shoot.clientPhone) ||
    normalizeText(shoot.clientEmail) ||
    normalizeText(shoot.clientInstagram),
  );
};

const getContactSortValue = (contact: ClientContact) => {
  return (contact.name || contact.phone || contact.email || contact.instagram || '').toLowerCase();
};

export const upsertContactFromShoot = (
  contacts: ClientContact[],
  shoot: Shoot,
  nowIso = new Date().toISOString(),
): ClientContact[] => {
  if (!isUsableContactShoot(shoot)) {
    return sortContacts(contacts);
  }

  const incoming = {
    name: normalizeText(shoot.clientName) || 'Unnamed Client',
    phone: normalizeText(shoot.clientPhone),
    email: normalizeText(shoot.clientEmail),
    instagram: normalizeText(shoot.clientInstagram),
  };
  const incomingKey = getContactKey(incoming);
  const existingIndex = contacts.findIndex((contact) => getContactKey(contact) === incomingKey);
  const sourceShootIds = existingIndex >= 0
    ? Array.from(new Set([...contacts[existingIndex].sourceShootIds, shoot.id]))
    : [shoot.id];

  const nextContact: ClientContact = existingIndex >= 0
    ? {
        ...contacts[existingIndex],
        name: incoming.name || contacts[existingIndex].name,
        phone: incoming.phone || contacts[existingIndex].phone,
        email: incoming.email || contacts[existingIndex].email,
        instagram: incoming.instagram || contacts[existingIndex].instagram,
        sourceShootIds,
        shootCount: sourceShootIds.length,
        lastShootTitle: shoot.title || contacts[existingIndex].lastShootTitle,
        lastShootDate: shoot.primaryDate || contacts[existingIndex].lastShootDate,
        updatedAt: nowIso,
      }
    : {
        id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...incoming,
        sourceShootIds,
        shootCount: sourceShootIds.length,
        lastShootTitle: shoot.title,
        lastShootDate: shoot.primaryDate,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

  const nextContacts = [...contacts];
  if (existingIndex >= 0) {
    nextContacts[existingIndex] = nextContact;
  } else {
    nextContacts.push(nextContact);
  }

  return sortContacts(nextContacts);
};

export const upsertContactsFromShoots = (
  contacts: ClientContact[],
  shoots: Shoot[],
  nowIso = new Date().toISOString(),
) => {
  return shoots.reduce(
    (currentContacts, shoot) => upsertContactFromShoot(currentContacts, shoot, nowIso),
    contacts,
  );
};

export const sortContacts = (contacts: ClientContact[]) => {
  return [...contacts].sort((a, b) => getContactSortValue(a).localeCompare(getContactSortValue(b)));
};

export const mergeContacts = (
  localContacts: ClientContact[],
  cloudContacts: ClientContact[],
) => {
  const contactMap = new Map<string, ClientContact>();

  [...localContacts, ...cloudContacts].forEach((contact) => {
    const key = getContactKey(contact);
    const existing = contactMap.get(key);

    if (!existing || new Date(contact.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
      contactMap.set(key, {
        ...contact,
        sourceShootIds: Array.from(new Set(contact.sourceShootIds || [])),
        shootCount: Math.max(contact.shootCount || 0, (contact.sourceShootIds || []).length),
      });
    }
  });

  return sortContacts(Array.from(contactMap.values()));
};

const escapeVCardValue = (value?: string) => {
  return normalizeText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
};

const getNameParts = (value?: string) => {
  const parts = normalizeText(value || 'Unnamed Client').split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');
  return { firstName, lastName };
};

const getInstagramUrl = (value?: string) => {
  const instagram = normalizeText(value);
  if (!instagram) return '';
  if (/^https?:\/\//i.test(instagram)) return instagram;
  return `https://instagram.com/${instagram.replace(/^@/, '')}`;
};

export const contactsToVCard = (contacts: ClientContact[]) => {
  return sortContacts(contacts)
    .map((contact) => {
      const { firstName, lastName } = getNameParts(contact.name);
      const instagramUrl = getInstagramUrl(contact.instagram);
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`,
        `FN:${escapeVCardValue(contact.name || 'Unnamed Client')}`,
        'ORG:AKHIL 360',
      ];

      if (contact.phone) {
        lines.push(`TEL;TYPE=CELL:${escapeVCardValue(contact.phone)}`);
      }

      if (contact.email) {
        lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(contact.email)}`);
      }

      if (contact.instagram) {
        lines.push(`NOTE:Instagram ${escapeVCardValue(contact.instagram)}`);
      }

      if (instagramUrl) {
        lines.push(`URL;TYPE=Instagram:${escapeVCardValue(instagramUrl)}`);
      }

      lines.push('END:VCARD');
      return lines.join('\r\n');
    })
    .join('\r\n');
};
