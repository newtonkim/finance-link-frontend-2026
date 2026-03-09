
export const status = {
  active: { label: "Active", className: " text-xs font-bold px-2 py-1 rounded-full   bg-green-100 text-green-700" },
  expired: { label: "expired", className: " text-xs font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" },
  "trial": { label: "transit", className: " text-xs font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  basic: {
    label: "basic",
    className: "text-xs font-bold px-2 py-1 rounded-full bg-white text-amber-700 shadow-sm"
  },
  enterprise: {
    label: "enterprise",
    className: "text-xs font-bold px-2 py-1 rounded-full bg-amber-500/10 text-neutral-700 shadow-sm"
  },
  professional: {
    label: "Pending Approval",
    className: "text-xs font-bold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 shadow-sm"
  }, suspended: { label: "Suspended", className: " text-xs font-bold px-2 py-1 rounded-fullbg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400   " },
  fired: { label: "Fired", className: " text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700" },

};

export const paymentStatus = {
  unpaid: {
    label: "Unpaid",
    className: "text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700",
  },
  paid: {
    label: "Paid",
    className: "text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700",
  },
  partially_paid: {
    label: "Partially Paid",
    className: "text-xs font-bold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700",
  },
  refunded: {
    label: "Refunded",
    className: "text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700",
  },
  failed_payment: {
    label: "Failed Payment",
    className: "text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-600",
  },
};

export const paymentMethods = {
  cash: { label: "Cash", className: " font-bold px-2 py-1 rounded-full     text-green-700" },
  card: { label: "Card", className: "  font-bold px-2 py-1 rounded-full  text-blue-600" },
  mobile_money: { label: "Mobile Money", className: " font-bold px-0 py-1 rounded-full  text-blue-700" },
}




export const statusMap = {
  ...status,
  ...paymentStatus,
  ...paymentMethods
}

// export default statusMap