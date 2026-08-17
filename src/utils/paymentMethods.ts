import { PaymentMethod } from '../types/shoot';

export const ONLINE_PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Bank Transfer',
  'Card',
  'Cheque',
  'Other',
];

export const normalizeOnlinePaymentMethod = (method?: PaymentMethod): PaymentMethod => {
  if (!method || method === 'Cash') {
    return 'UPI';
  }

  return method;
};

export const getPaymentMethodLabel = (method?: PaymentMethod): string => {
  const normalizedMethod = normalizeOnlinePaymentMethod(method);

  if (normalizedMethod === 'UPI') return 'UPI / GPay';
  if (normalizedMethod === 'Bank Transfer') return 'Bank Transfer';
  if (normalizedMethod === 'Card') return 'Card / POS';
  if (normalizedMethod === 'Cheque') return 'Cheque';
  return 'Other Online';
};
