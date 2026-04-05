import type { RouteRecordRaw } from 'vue-router'

const LoanApplicationsIndex = () => import('./pages/LoanApplicationsIndex.vue')
const LoanApplicationCreate = () => import('./pages/LoanApplicationCreate.vue')
const LoanApplicationEdit = () => import('./pages/LoanApplicationEdit.vue')
const LoanApplicationShow = () => import('./pages/LoanApplicationShow.vue')
const LoanDisbursementQueue = () => import('./pages/LoanDisbursementQueue.vue')
const PendingVotes = () => import('./pages/PendingVotes.vue')
const ActiveLoansIndex = () => import('./pages/ActiveLoansIndex.vue')
const LoanAccountDetail = () => import('./pages/LoanAccountDetail.vue')

export const loanRoutes: RouteRecordRaw[] = [
    {
        path: 'loan-applications',
        name: 'tenant-loans',
        component: LoanApplicationsIndex,
    },
    {
        path: 'loan-applications/create',
        name: 'tenant-loans-create',
        component: LoanApplicationCreate,
    },
    {
        path: 'loan-applications/pending-votes',
        name: 'tenant-loans-pending-votes',
        component: PendingVotes,
    },
    {
        path: 'loan-applications/:id/edit',
        name: 'tenant-loans-edit',
        component: LoanApplicationEdit,
    },
    {
        path: 'loan-applications/:id',
        name: 'tenant-loans-show',
        component: LoanApplicationShow,
    },
    {
        path: 'loan-disbursements',
        name: 'tenant-loan-disbursements',
        component: LoanDisbursementQueue,
    },
    {
        path: 'loans',
        name: 'tenant-active-loans',
        component: ActiveLoansIndex,
    },
    {
        path: 'loans/:id',
        name: 'tenant-loan-account',
        component: LoanAccountDetail,
    },
]
