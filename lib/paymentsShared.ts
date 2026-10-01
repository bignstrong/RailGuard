import { z } from 'zod';

// Константы оплаты без Node-зависимостей: нужны и странице в браузере, и серверу (lib/payments.ts).
export const PROVIDERS = ['yookassa', 'cloudpayments'] as const;
export type ProviderKey = (typeof PROVIDERS)[number];
export const PROVIDER_LABEL: Record<ProviderKey, string> = { yookassa: 'ЮKassa', cloudpayments: 'CloudPayments' };
export const PAY_STATUSES = ['pending', 'succeeded', 'canceled', 'refunded', 'failed'] as const;
export type PayStatus = (typeof PAY_STATUSES)[number];
export const PAY_STATUS_LABEL: Record<PayStatus, string> = { pending: 'Ожидает оплаты', succeeded: 'Оплачен', canceled: 'Отменён', refunded: 'Возвращён', failed: 'Ошибка' };

// Чеки 54-ФЗ: [подпись, код ЮKassa, код CloudPayments].
export const TAX_SYSTEMS = {
  osn: ['ОСН', 1, 0],
  usn_income: ['УСН «доходы»', 2, 1],
  usn_income_outcome: ['УСН «доходы минус расходы»', 3, 2],
  esn: ['ЕСХН', 5, 4],
  patent: ['Патент', 6, 5],
} as const;
export const VATS = { none: ['Без НДС', 1, null], '0': ['НДС 0%', 2, 0], '5': ['НДС 5%', 7, 5], '7': ['НДС 7%', 8, 7], '10': ['НДС 10%', 3, 10], '22': ['НДС 22%', 11, 22] } as const;

export const SettingsSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(['', ...PROVIDERS]),
  receipt: z.boolean(),
  tax: z.enum(Object.keys(TAX_SYSTEMS) as [keyof typeof TAX_SYSTEMS]),
  vat: z.enum(Object.keys(VATS) as [keyof typeof VATS]),
  yookassa: z.object({ shopId: z.string().trim().max(64), secretKey: z.string().trim().max(200) }),
  cloudpayments: z.object({ publicId: z.string().trim().max(64), apiSecret: z.string().trim().max(200) }),
});
export type PaymentSettings = z.infer<typeof SettingsSchema>;
export const DEFAULT_PAYMENTS: PaymentSettings = {
  enabled: false,
  provider: '',
  receipt: false,
  tax: 'usn_income',
  vat: 'none',
  yookassa: { shopId: '', secretKey: '' },
  cloudpayments: { publicId: '', apiSecret: '' },
};

export const isConfigured = (s: PaymentSettings, p: ProviderKey | '') =>
  p === 'yookassa' ? !!(s.yookassa.shopId && s.yookassa.secretKey) : p === 'cloudpayments' ? !!(s.cloudpayments.publicId && s.cloudpayments.apiSecret) : false;
