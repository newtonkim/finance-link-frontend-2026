export const status = {
  pending: {
    label: 'Pending',
    className: ' text-sm font-medium px-3 text-sm py-0 rounded-full   bg-yellow-100 text-yellow-700',
  },
  active: {
    label: 'Active',
    className: ' text-sm     bg-green-100 text-green-700   dark:text-emerald-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full',
  },
  expired: {
    label: 'expired',
    className:
      ' text-sm font-medium px-3 text-sm py-0 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  },
  trial: {
    label: 'transit',
    className:
      ' text-sm font-medium px-3 text-sm py-0 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  },
  basic: {
    label: 'basic',
    className: 'text-sm font-medium px-3 text-sm py-0 rounded-full bg-white text-amber-700 shadow-sm',
  },
  enterprise: {
    label: 'enterprise',
    className:
      'text-sm font-medium px-3 text-sm py-0 rounded-full bg-amber-500/10 text-neutral-700 shadow-sm',
  },
  professional: {
    label: 'Pending Approval',
    className: 'text-sm font-medium px-3 text-sm py-0 rounded-full bg-yellow-100 text-yellow-700 shadow-sm',
  },
  suspended: {
    label: 'Suspended',
    className:
      ' text-sm font-medium px-3 text-sm py-0 rounded-fullbg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400   ',
  },
  fired: {
    label: 'Fired',
    className: ' text-sm font-medium px-3 text-sm py-0 rounded-full bg-red-100 text-red-700',
  },
  failed: {
    label: 'Failed',
    className: 'text-sm font-medium px-3 text-sm py-0 rounded-full bg-red-100 text-red-600',
  },
}

export const paymentStatus = {
  unpaid: {
    label: 'Unpaid',
    className: 'text-sm font-medium px-3 text-sm py-0 rounded-full bg-red-100 text-red-700',
  },
  paid: {
    label: 'Paid',
    className: 'text-sm font-medium px-3 text-sm py-0 rounded-full bg-green-100 text-green-700',
  },
  completed: {
    label: 'completed',
    className: 'text-sm font-medium px-3 text-sm py-0 rounded-full bg-green-200 text-green-700',
  },
  partially_paid: {
    label: 'Partially Paid',
    className: 'text-sm font-medium px-3 text-sm py-0 rounded-full bg-yellow-100 text-yellow-700',
  },
  refunded: {
    label: 'Refunded',
    className: 'text-sm font-medium px-3 text-sm py-0 rounded-full bg-blue-100 text-blue-700',
  },
  failed_payment: {
    label: 'Failed Payment',
    className: 'text-sm font-medium px-3 text-sm py-0 rounded-full bg-red-100 text-red-600',
  },
}

export const paymentMethods = {
  cash: { label: 'Cash', className: ' font-medium px-3 text-sm py-0 rounded-full     text-green-700' },
  card: { label: 'Card', className: '  font-medium px-3 text-sm py-0 rounded-full  text-blue-600' },
  bank: { label: 'Bank', className: '  font-medium px-3 text-sm py-0 rounded-full  text-blue-600' },
  mobile_money: {
    label: 'Mobile Money',
    className: ' font-medium px-0 py-1 rounded-full  text-blue-700',
  },
}
export const systemRoles = {
  admin: {
    label: 'admin',
    className: 'font-medium px-3 text-sm py-0 rounded-full text-purple-700',
  },

  'super-admin': {
    label: 'supper admin',
    className: 'font-medium px-3 text-sm py-0 rounded-full text-neutral-600/60',
  },

  ordinary: {
    label: 'Ordinary',
    className: 'font-medium px-3 text-sm py-0 rounded-full text-teal-600',
  },

  manager: {
    label: 'Manager',
    className: 'font-medium px-3 text-sm py-0 rounded-full text-red-600',
  },

  accountant: {
    label: 'Accountant',
    className: 'font-medium px-3 text-sm py-0 rounded-full text-indigo-600',
  },
}
// maritalOptions: [{ id: 'single', name: 'Single' }, { id: 'married', name: 'Married' }, { id: 'divorced', name: 'Divorced' }, { id: 'widowed', name: 'Widowed' }]

const marriageStatus = {
  single: {
    label: 'Single',
    className:
      'inline-flex items-center px-3 py-0 text-sm font-medium rounded-full bg-teal-100 text-teal-700 border border-teal-200',
  },
  married: {
    label: 'Married',
    className:
      'inline-flex items-center px-3 py-0 text-sm font-medium rounded-full bg-indigo-100 text-indigo-700/60 border border-indigo-200',
  },
  divorced: {
    label: 'Divorced',
    className:
      'inline-flex items-center px-3 py-0 text-sm font-medium rounded-full bg-rose-100 text-rose-700 border border-rose-200',
  },
  widowed: {
    label: 'Widowed',
    className:
      'inline-flex items-center px-3 py-0 text-sm font-medium rounded-full bg-red-100 text-red-700 border border-red-200',
  },
}

   
const loanOptions = {
 draft: {
    label: 'Draft',
    className: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full ',
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full ',
  },
  under_review: {
    label: 'Under Review',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full ',
  },
  awaiting_documents: {
    label: 'Awaiting Documents',
    className: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full ',
  },
  recommended: {
    label: 'Recommended',
    className: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full ',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full ',
  },
  disbursement_pending: {
    label: 'Disbursement Pending',
    className: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full ',
  },
  disbursed: {
    label: 'Disbursed',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full ',
  },
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full ',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 dark :bg-red-900/30 dark:text-red-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full ',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full ',
  },
  arrears: {
    label: 'In Arrears',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full ',
  },
  closed: {
    label: 'Closed',
    className: 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400 inline-flex items-center px-3 py-0 text-sm font-medium rounded-full ',
  },
}
const genderOptions = {
  male: {
    label: 'Male',
    className:
      'inline-flex items-center px-3 py-0 text-sm font-medium rounded-full bg-teal-100 text-teal-700 border border-teal-200',
  },
  female: {
    label: 'Female',
    className:
      'inline-flex items-center px-3 py-0 text-sm font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200',
  },
  other: {
    label: 'Other',
    className:
      'inline-flex items-center px-3 py-0 text-sm font-medium rounded-full bg-rose-100 text-rose-700 border border-rose-200',
  },
}



export const statusMap = {
  ...loanOptions,
  ...status,
  ...genderOptions,
  ...marriageStatus,
  ...paymentStatus,
  ...paymentMethods,
  ...systemRoles,
}

// export default statusMap
