import { reactive, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { toast } from 'vue-sonner';
import { membersApi } from '@/tenant/apis/members/membersApi';
import { tenantClient } from '@/tenant/apis/tenantClient';
import { getLocalValues } from '@/Global';

export type SavingsAccount = {
    id: number;
    account_no: string;
    account_type: string;
    balance: string;
    balance_formatted?: string | null;
    consider_min_balance?: boolean;
    minimum_balance?: number;
    minimum_balance_formatted?: string | null;
    withdrawable_amount?: number;
    withdrawable_amount_formatted?: string | null;
    initial_deposit_formatted?: string | null;
    custom_monthly_fee_enabled?: boolean;
    custom_monthly_fee_type?: string;
    custom_monthly_fee_amount?: number | string | null;
};

export type SavingsProduct = {
    id: number;
    name: string;
    type: string;
    minimum_balance: string;
    charges?: Array<{ id: number; type: string; charge_type: string; amount: string }>;
    // FD fields
    interest_payout_type?: 'at_maturity' | 'periodic_payout' | 'compound' | null;
    interest_posting_frequency?: string | null;
    default_tenor_months?: number | null;
    maturity_action?: string | null;
};

export function useMember() {
    const route = useRoute();

    const member = reactive({
        id: 0,
        member_number: '',
        member_type: '',
        name: '',
        salutation: '',
        gender: '',
        dob: '',
        phone: '',
        phone_country: '',
        other_contact: '',
        other_contact_country: '',
        mobile_money_number: '',
        mobile_money_country: '',
        email: '',
        id_number: '',
        marital_status: '',
        nationality: '',
        address: '',
        next_of_kin: '',
        next_of_kin_contact: '',
        initial_deposit: '',
        status: '',
        total_balance: '',
        joined_at: '',
        created_at: '',
        avatar_url: null as string | null,
        referred_by: null as number | null,
        referred_by_name: null as string | null,
        registered_by: null as number | null,
        registered_by_name: null as string | null,
        savings_accounts: [] as SavingsAccount[],
        loans: [] as any[],
        transactions: [] as any[],
    });

    const savingsProducts = ref<SavingsProduct[]>([]);
    const pageLoading = ref(true);

    async function fetchMember(silent = false) {
  const profile =  getLocalValues('memberProfile')

 
        const id = Number(profile.id);
        if (!id) return;
        if (!silent) pageLoading.value = true;
        try {
            const res = await membersApi.show(id);
            const body = res.data;
            const memberData: Record<string, any> =
                body?.data?.member ?? body?.member ?? body?.data ?? body ?? {};

            for (const key of Object.keys(memberData)) {
                (member as any)[key] = memberData[key];
            }

            const rawTxns = (memberData as any)?.transactions;
            if (Array.isArray(rawTxns)) {
                member.transactions = rawTxns;
            } else if (Array.isArray(rawTxns?.data)) {
                member.transactions = rawTxns.data;
            }

            const products = body?.data?.savingsProducts ?? body?.savingsProducts ?? [];
            if (Array.isArray(products)) savingsProducts.value = products;
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Failed to load member data.');
        } finally {
            if (!silent) pageLoading.value = false;
        }
    }

    const memberInitials = computed(() => {
        if (!member.name) return '';
        return member.name.split(' ').map((p: string) => p.charAt(0).toUpperCase()).slice(0, 2).join('');
    });

    const computedAge = computed(() => {
        if (!member.dob) return '—';
        const birth = new Date(member.dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return `${age} yrs`;
    });

    const currentBalance = computed(() => {
        if (!member.savings_accounts?.length) return 0;
        return member.savings_accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    });

    // Avatar upload
    const avatarInput = ref<HTMLInputElement | null>(null);
    const uploadProcessing = ref(false);

    const triggerAvatarUpload = () => avatarInput.value?.click();

    const handleAvatarUpload = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (!target.files?.[0]) return;
        uploadProcessing.value = true;
        const formData = new FormData();
        formData.append('avatar', target.files[0]);
        try {
            await tenantClient.post(`/members/${member.id}/avatar`, formData);
            toast.success('Avatar updated successfully.');
            if (avatarInput.value) avatarInput.value.value = '';
            window.location.reload();
        } catch {
            toast.error('Failed to upload avatar.');
        } finally {
            uploadProcessing.value = false;
        }
    };

    // Approval / rejection
    const approving = ref(false);
    const rejecting = ref(false);

    const approveMember = async () => {
        approving.value = true;
        try {
            await tenantClient.put(`/members/${member.id}/approve`);
            toast.success('Member approved successfully. Account is now active.');
            member.status = 'active';
        } catch {
            toast.error('Failed to approve member. Please try again.');
        } finally {
            approving.value = false;
        }
    };

    const rejectMember = async (reason: string) => {
        rejecting.value = true;
        try {
            await tenantClient.put(`/members/${member.id}/reject`, { rejection_reason: reason });
            toast.success('Member registration rejected.');
            member.status = 'rejected';
        } catch {
            toast.error('Failed to reject member. Please try again.');
        } finally {
            rejecting.value = false;
        }
    };

    // Delete
    const deleting = ref(false);

    const deleteMember = async (onSuccess: () => void) => {
        deleting.value = true;
        try {
            await tenantClient.delete(`/members/${member.id}`);
            toast.success('Member deleted successfully.');
            onSuccess();
        } catch {
            toast.error('An error occurred. The member could not be deleted.');
        } finally {
            deleting.value = false;
        }
    };

    return {
        member,
        savingsProducts,
        pageLoading,
        fetchMember,
        memberInitials,
        computedAge,
        currentBalance,
        avatarInput,
        uploadProcessing,
        triggerAvatarUpload,
        handleAvatarUpload,
        approving,
        rejecting,
        approveMember,
        rejectMember,
        deleting,
        deleteMember,
    };
}
