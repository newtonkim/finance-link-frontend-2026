import type { CurrencyOption } from '@/tenant/apis/currencies/currenciesApi'

export const DEFAULT_CURRENCIES: CurrencyOption[] = [
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'UGX' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'SEK' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'NOK' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'DKK' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'CFA' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨' },
]

export const APPLICATION_OPTIONS = [
  { id: 'on_shares', name: 'On Shares' },
  { id: 'on_registration', name: 'On Registration' },
  { id: 'other', name: 'Other' },
]

export const CHARGE_TYPE_OPTIONS = [
  { id: 'percentage', name: 'Percentage' },
  { id: 'amount', name: 'Amount' },
]

export const WHERE_TO_APPLY_OPTIONS = [
  { id: 'savings', name: 'Saving products' },
  { id: 'shares', name: 'Shares' },
]

export const INTERVAL_TYPE_OPTIONS = [
  { id: 'days', name: 'Days' },
  { id: 'weeks', name: 'Weeks' },
  { id: 'months', name: 'Months' },
  { id: 'years', name: 'Years' },
]

export const IS_FINE_OPTIONS = [
  { id: 'yes', name: 'Yes' },
  { id: 'no', name: 'No' },
]

export const IS_REVENUE_OPTIONS = [
  { id: 'yes', name: 'Yes' },
  { id: 'no', name: 'No' },
]

// Savings event-types a general charge can be wired to fire on. Backend stores
// these in savings_product_charges.type and reads them in ChargeCalculatorService.
export const TRIGGER_TYPE_OPTIONS = [
  { id: 'deposit', name: 'Deposit' },
  { id: 'withdraw', name: 'Withdrawal' },
  { id: 'transfer', name: 'Transfer' },
]

export const INPUT_CLS =
  'w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'

export const FIELD_CLS =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
