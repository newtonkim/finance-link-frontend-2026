import type { RouteRecordRaw } from 'vue-router'

const LoanApplicationsIndex = () => import('./pages/LoanApplicationsIndex.vue')
const LoanApplicationCreate = () => import('./pages/LoanApplicationCreate.vue')
const LoanApplicationEdit = () => import('./pages/LoanApplicationEdit.vue')
const LoanApplicationShow = () => import('./pages/LoanApplicationShow.vue')

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
        path: 'loan-applications/:id/edit',
        name: 'tenant-loans-edit',
        component: LoanApplicationEdit,
    },
    {
        path: 'loan-applications/:id',
        name: 'tenant-loans-show',
        component: LoanApplicationShow,
    },
]
