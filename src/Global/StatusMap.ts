
export const status = {
  active: { label: "Active", className: " text-xs font-bold px-2 py-1 rounded-full   bg-green-100 text-green-700" },
  reached: { label: "Reached", className: " text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-600" },
  "on-leave": { label: "On Leave", className: " text-xs font-bold px-2 py-1 rounded-full  bg-blue-100 text-blue-700" },
  "in-transit": { label: "transit", className: " text-xs font-bold px-2 py-1 rounded-full bg-ugGreen text-white" },
  "approved-approval": { label: "Approved", className: " text-xs font-bold px-2 py-1 rounded-full bg-ugGreen " },
  "pedding-approval": { label: "Pending Approval", className: " text-xs font-bold px-2 py-1 rounded-full  bg-yellow-100 text-yellow-700" },
  suspended: { label: "Suspended", className: " text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 " },
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