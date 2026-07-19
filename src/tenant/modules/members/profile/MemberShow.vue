<script setup lang="ts">
import { ref, computed, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { storeToRefs } from 'pinia';
import { jsPDF } from 'jspdf';
import { UserCircle2, FileText, TrendingUp, MinusCircle, Wallet, BarChart3, RotateCcw, Printer,
    User, Phone, Users, Mail, MapPin, Calendar, Copy, Check, Hash, Heart, ShieldCheck, CreditCard, Smartphone } from 'lucide-vue-next';
import { formatMoneyValue } from '@/Global';
import { tenantClient } from '@/tenant/apis/tenantClient';
import { useCurrencyStore } from '@/stores/currency';
import { useMember } from '../composables/useMember';
import MemberSidebar from './MemberSidebar.vue';
import MemberActionBar from './MemberActionBar.vue';
import MemberAccountsTable from './MemberAccountsTable.vue';
import MemberTransactionsTab from './MemberTransactionsTab.vue';
import MemberLoansTab from './MemberLoansTab.vue';
import DepositWithdrawDrawer from './DepositWithdrawDrawer.vue';
import NewAccountDrawer from './NewAccountDrawer.vue';
import CustomFeeDrawer from './CustomFeeDrawer.vue';
import { memberProfileApi } from '@/tenant/apis/savings/member-profileApi';
import Statement from './statement.vue';
const { getMemberProfileDetail } = memberProfileApi();

const router = useRouter();
const { currencyCode } = storeToRefs(useCurrencyStore());

const {
    member, savingsProducts, pageLoading, fetchMember,
    memberInitials, computedAge, currentBalance,
    avatarInput, uploadProcessing, triggerAvatarUpload, handleAvatarUpload,
    approving, rejecting, approveMember, rejectMember,
    deleting, deleteMember,
} = useMember();
interface ProfileDetails {
    details: Record<string, unknown>;
    accounts: unknown[];
}
const profileDetails = ref<ProfileDetails | null>(null)


async function initialize() {
    pageLoading.value = true;
    const details = await getMemberProfileDetail({})
    const data: Record<string, unknown> = {};
    const { member_details, member_accounts } = details??{}
    // const accounts = details.member_accounts
    for (const key in member_details) {
        const element = member_details[key];
        data[key] = element;
    }
    profileDetails.value = { details: data, accounts: member_accounts };
    pageLoading.value = false;
      fetchMember()
}

// ── Tabs ────────────────────────────────────────────────────────────────────
const activeTab = ref('profile');
onBeforeMount(() => {
    profileDetails.value = null
    initialize();
  
});

const tabs = computed(() => [
    { id: 'profile', label: 'member Profile', icon: UserCircle2, count: null },
    { id: 'transactions', label: 'member Transactions', icon: FileText, count: member.transactions?.length || 0 },
    { id: 'savings', label: 'member Savings', icon: TrendingUp, count: member.transactions?.filter((t: { type?: string }) => t.type?.toLowerCase() === 'deposit').length || 0 },
    { id: 'withdrawal', label: 'member Withdrawal', icon: MinusCircle, count: member.transactions?.filter((t: { type?: string }) => ['withdrawal', 'withdraw'].includes(t.type?.toLowerCase())).length || 0 },
    { id: 'loans', label: 'member Loans', icon: Wallet, count: member.loans?.length || 0 },
    { id: 'shares', label: 'member Shares', icon: BarChart3, count: null },
    { id: 'statement', label: 'member Statement', icon: Printer, },
]);

// ── Drawer refs ──────────────────────────────────────────────────────────────
const depositDrawer = ref<InstanceType<typeof DepositWithdrawDrawer> | null>(null);
const newAccountDrawer = ref<InstanceType<typeof NewAccountDrawer> | null>(null);
const customFeeDrawer = ref<InstanceType<typeof CustomFeeDrawer> | null>(null);

// ── Transaction reversal ────────────────────────────────────────────────────
const showTxnDeleteDialog = ref(false);
const txnToDelete = ref<{ id: number; reference: string; is_reversed: boolean; type: string; is_reversible: boolean } | null>(null);
const isDeletingTxn = ref(false);
const formData = ref<any>({});

const confirmDeleteTxn = (txn: { id: number; reference: string; is_reversed: boolean; type: string; is_reversible: boolean }) => {
    if (txn.is_reversed || txn.type === 'reversal' || txn.is_reversible === false) return;
    txnToDelete.value = txn;
    showTxnDeleteDialog.value = true;
};

const executeDeleteTxn = async () => {
    if (!txnToDelete.value) return;
    isDeletingTxn.value = true;
    try {
        await tenantClient.post(`/transactions/${txnToDelete.value.id}/reverse`, formData.value);
        toast.success('Transaction reversed successfully.');
        showTxnDeleteDialog.value = false;
        txnToDelete.value = null;
        // Refresh member data so balances and the full transaction list are up to date
        fetchMember(true);
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message || 'Failed to reverse transaction.');
    } finally {
        isDeletingTxn.value = false;
    }
};

// ── Receipt printing ─────────────────────────────────────────────────────────
type ReceiptLine = {
    id: number;
    line_type: 'principal' | 'charge';
    description: string;
    amount: number;
    amount_formatted?: string;
    type?: string;
    reference?: string;
};

type ReceiptPayload = {
    receipt_number?: string;
    reference?: string;
    transaction_type?: string;
    transaction_date?: string;
    created_at?: string;
    payment_mode?: string;
    received_by?: string;
    narration?: string;
    currency_code?: string;
    branding?: {
        sacco_name?: string;
        tagline?: string;
        logo_url?: string | null;
    };
    branch?: {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
    } | null;
    member?: {
        name?: string;
        member_number?: string;
        code?: string;
        phone?: string;
    } | null;
    account?: {
        account_no?: string;
        code?: string;
        account_type?: string;
        product?: string | null;
    } | null;
    main_transaction?: ReceiptLine;
    charge_lines?: ReceiptLine[];
    lines?: ReceiptLine[];
    totals?: {
        transaction_amount?: number;
        transaction_amount_formatted?: string;
        charge_total?: number;
        charge_total_formatted?: string;
        net_deposit_amount?: number | null;
        net_deposit_amount_formatted?: string | null;
        net_withdrawal_amount?: number | null;
        net_withdrawal_amount_formatted?: string | null;
        total_account_debit?: number | null;
        total_account_debit_formatted?: string | null;
    };
};

const isPrintingReceipt = ref(false);

function receiptAssetUrl(path?: string | null): string | null {
    if (!path) return null;
    if (/^(https?:|data:)/i.test(path)) return path;

    const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000/api/v1';
    const backendOrigin = String(backendUrl).replace(/\/api\/v1.*$/i, '').replace(/\/+$/, '');
    return `${backendOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}

async function imageToDataUrl(url?: string | null): Promise<string | null> {
    if (!url) return null;
    if (url.startsWith('data:')) return url;

    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();

        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ''));
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

function cleanText(value: unknown, fallback = '—'): string {
    const text = String(value ?? '').trim();
    return text || fallback;
}

function moneyText(value?: string | number | null, formatted?: string | null, currency?: string): string {
    if (formatted) return formatted;
    return `${currency || currencyCode.value} ${formatCurrency(value ?? 0)}`;
}

function shortReceiptNo(receipt?: string): string {
    const value = cleanText(receipt, '');
    return value.length > 28 ? `${value.slice(0, 14)}…${value.slice(-10)}` : value;
}

function receiptDateTime(value?: string): { date: string; time: string; combined: string } {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
        return { date: '—', time: '—', combined: '—' };
    }

    const dateText = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeText = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date: dateText, time: timeText, combined: `${dateText} · ${timeText}` };
}

function saveReceiptPdf(doc: jsPDF, receipt: ReceiptPayload) {
    const fileReceipt = cleanText(receipt.receipt_number || receipt.reference, 'receipt')
        .replace(/[^a-z0-9_-]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    const filename = `${fileReceipt || 'receipt'}.pdf`;
    const blobUrl = doc.output('bloburl');
    const opened = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (!opened) doc.save(filename);
    // Keep a deterministic fallback for browsers that block blob windows.
    setTimeout(() => URL.revokeObjectURL(String(blobUrl)), 60_000);
    return filename;
}

async function generateReceiptPdf(receipt: ReceiptPayload) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const right = pageWidth - margin;
    const currency = receipt.currency_code || currencyCode.value;
    const saccoName = cleanText(receipt.branding?.sacco_name, 'SACCO');
    const receiptKind = cleanText(receipt.transaction_type, 'transaction').replace(/[-_]/g, ' ');
    const receiptType = receiptKind.toUpperCase();
    const issued = receiptDateTime(receipt.transaction_date || receipt.created_at);
    const memberName = cleanText(receipt.member?.name);
    const accountNo = cleanText(receipt.account?.account_no || receipt.account?.code);
    const chargeTotal = moneyText(receipt.totals?.charge_total, receipt.totals?.charge_total_formatted, currency);
    const primaryAmount = moneyText(receipt.totals?.transaction_amount, receipt.totals?.transaction_amount_formatted || receipt.main_transaction?.amount_formatted, currency);
    const finalAmount = receipt.transaction_type === 'deposit'
        ? moneyText(receipt.totals?.net_deposit_amount, receipt.totals?.net_deposit_amount_formatted, currency)
        : moneyText(receipt.totals?.net_withdrawal_amount, receipt.totals?.net_withdrawal_amount_formatted, currency);
    const finalLabel = receipt.transaction_type === 'deposit' ? 'NET DEPOSIT' : 'NET PAID';
    const finalSubLabel = receipt.transaction_type === 'deposit' ? 'Amount credited to account' : 'Cash paid to client';
    const logo = await imageToDataUrl(receiptAssetUrl(receipt.branding?.logo_url));

    const navy: [number, number, number] = [24, 37, 56];
    const gold: [number, number, number] = [205, 164, 52];
    const slate: [number, number, number] = [100, 116, 139];
    const ink: [number, number, number] = [31, 41, 55];
    const border: [number, number, number] = [226, 232, 240];

    const setText = (color: [number, number, number]) => doc.setTextColor(color[0], color[1], color[2]);
    const setFill = (color: [number, number, number]) => doc.setFillColor(color[0], color[1], color[2]);
    const setDraw = (color: [number, number, number]) => doc.setDrawColor(color[0], color[1], color[2]);
    const escapedCurrency = currency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const amountOnly = (value: string) => value.replace(new RegExp(`^${escapedCurrency}\\s*`, 'i'), '').trim();
    const drawAmount = (x: number, y: number, value: string, size = 10, color: [number, number, number] = ink) => {
        setText(slate);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(Math.max(6.5, size - 3));
        doc.text(currency, x - 37, y, { align: 'right' });
        setText(color);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(size);
        doc.text(amountOnly(value), x, y, { align: 'right' });
    };
    const drawRule = (y: number) => {
        setDraw(border);
        doc.setLineWidth(0.25);
        doc.line(margin, y, right, y);
    };

    const logoType = logo && (logo.toLowerCase().startsWith('data:image/jpeg') || logo.toLowerCase().startsWith('data:image/jpg'))
        ? 'JPEG'
        : 'PNG';

    // ── Page surface ───────────────────────────────────────────────────────────
    doc.setFillColor(244, 247, 250);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(4, 4, pageWidth - 8, pageHeight - 8, 2.5, 2.5, 'F');

    // ── Centered brand watermark (fills the mid-page, keeps balance) ────────────
    const GState = (doc as unknown as { GState?: new (o: { opacity: number }) => unknown }).GState;
    const wmCx = pageWidth / 2;
    const wmCy = pageHeight / 2 + 18;
    if (logo && typeof GState === 'function') {
        doc.setGState(new GState({ opacity: 0.05 }));
        const wmSize = 95;
        doc.addImage(logo, logoType, wmCx - wmSize / 2, wmCy - wmSize / 2, wmSize, wmSize);
        doc.setGState(new GState({ opacity: 1 }));
    } else {
        setText([237, 241, 247]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(150);
        doc.text(saccoName.charAt(0).toUpperCase(), wmCx, wmCy + 50, { align: 'center' });
    }

    // ── Header band ─────────────────────────────────────────────────────────────
    setFill(navy);
    doc.roundedRect(4, 4, pageWidth - 8, 34, 2.5, 2.5, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(4, 35, pageWidth - 8, 3, 'F');
    setFill(gold);
    doc.rect(4, 38, 92, 1.4, 'F');

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.circle(margin + 9, 21, 8.4, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(saccoName.charAt(0).toUpperCase(), margin + 9, 24.5, { align: 'center' });
    if (logo) {
        doc.setFillColor(255, 255, 255);
        doc.circle(margin + 9, 21, 7.8, 'F');
        doc.addImage(logo, logoType, margin + 3.6, 15.6, 10.8, 10.8);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(21);
    doc.setTextColor(255, 255, 255);
    doc.text(saccoName.toUpperCase(), margin + 26, 19);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(cleanText(receipt.branding?.tagline, 'Savings & Credit Cooperative'), margin + 26, 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('SAVINGS & CREDIT COOPERATIVE', margin + 26, 32);

    doc.setDrawColor(255, 255, 255);
    doc.roundedRect(right - 58, 12, 52, 9.5, 1.8, 1.8, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${receiptType} RECEIPT`, right - 32, 18.2, { align: 'center' });

    // ── Meta: receipt no / issued ───────────────────────────────────────────────
    setText(slate);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.text('R E C E I P T  N O.', margin, 50);
    doc.text('I S S U E D', right, 50, { align: 'right' });
    setText(navy);
    doc.setFontSize(11);
    doc.text(shortReceiptNo(receipt.receipt_number || receipt.reference).toUpperCase(), margin, 57.5);
    doc.text(issued.combined, right, 57.5, { align: 'right' });
    drawRule(64);

    // ── Account holder ──────────────────────────────────────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.rect(4, 64, pageWidth - 8, 26, 'F');
    setText(slate);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.text('A C C O U N T  H O L D E R', margin, 74);
    doc.text('A C C O U N T  N O.', right, 74, { align: 'right' });
    setText(ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(memberName, margin, 83.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    setText(navy);
    doc.text(accountNo.replace(/(.{6})/g, '$1 ').trim(), right, 83.5, { align: 'right' });
    drawRule(90);

    // ── Transaction details ─────────────────────────────────────────────────────
    setText(slate);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.text('T R A N S A C T I O N   D E T A I L S', margin, 103);

    let y = 116;
    const amountRows: Array<{ label: string; value: string; italic?: boolean; muted?: boolean }> = [
        { label: `Gross ${receiptKind.toLowerCase()}`, value: primaryAmount },
        { label: 'Transaction charge', value: chargeTotal },
    ];

    (receipt.charge_lines || []).forEach((line) => {
        amountRows.push({
            label: cleanText(line.description, 'Transaction charge'),
            value: `-${amountOnly(moneyText(line.amount, line.amount_formatted, currency))}`,
            italic: true,
            muted: true,
        });
    });

    amountRows.forEach((row) => {
        setText(row.muted ? slate : ink);
        doc.setFont('helvetica', row.italic ? 'italic' : 'normal');
        doc.setFontSize(row.italic ? 8.2 : 10);
        doc.text(doc.splitTextToSize(row.label, 120), margin, y);

        if (row.italic) {
            setText(slate);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(row.value, right, y, { align: 'right' });
        } else {
            drawAmount(right, y, row.value, 10.5, ink);
        }

        drawRule(y + 4);
        y += row.italic ? 8 : 11;
    });

    // ── NET total hero band ─────────────────────────────────────────────────────
    y = Math.max(y + 6, 150);
    setFill(navy);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 2.5, 2.5, 'F');
    setFill(gold);
    doc.rect(margin, y, 2.8, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(finalLabel, margin + 12, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(finalSubLabel, margin + 12, y + 17);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(currency, right - 62, y + 15, { align: 'right' });
    doc.setFontSize(22);
    doc.text(amountOnly(finalAmount), right - 4, y + 16, { align: 'right' });

    // ── Note strip (bridges to lower third) ─────────────────────────────────────
    const noteY = y + 36;
    doc.setFillColor(248, 250, 252);
    setDraw(border);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, noteY, pageWidth - margin * 2, 16, 2, 2, 'FD');
    setText(slate);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.6);
    doc.text('This is a computer-generated receipt and forms a valid record of the transaction above.', pageWidth / 2, noteY + 6.5, { align: 'center' });
    doc.text('Please retain it for your records.', pageWidth / 2, noteY + 11.5, { align: 'center' });

    // ── Served by / signature (anchored to lower section) ───────────────────────
    const signY = pageHeight - 48;
    setText(slate);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('S E R V E D  B Y', margin, signY);
    setText(ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(cleanText(receipt.received_by, 'SYSTEM'), margin, signY + 7);
    setDraw(border);
    doc.setLineWidth(0.3);
    doc.line(right - 82, signY + 5.5, right, signY + 5.5);
    setText(slate);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Signature & stamp', right - 41, signY + 11, { align: 'center' });

    // ── Footer ──────────────────────────────────────────────────────────────────
    const footerY = pageHeight - 11;
    setDraw(border);
    doc.setLineDashPattern([1.5, 1.2], 0);
    doc.line(margin, footerY - 8, right, footerY - 8);
    doc.setLineDashPattern([], 0);
    setText(navy);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.6);
    doc.text(`Thank you for saving with ${saccoName}.`, pageWidth / 2, footerY - 2.5, { align: 'center' });
    setText(slate);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    const contacts = [receipt.branch?.address, receipt.branch?.phone ? `Tel: ${receipt.branch.phone}` : null, receipt.branch?.email]
        .filter(Boolean)
        .join('  |  ');
    if (contacts) doc.text(contacts, pageWidth / 2, footerY + 2, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Mfuko Plus', pageWidth / 2 - 9, footerY + 5.6, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(' · Microfinance Management Software', pageWidth / 2 - 8, footerY + 5.6);

    saveReceiptPdf(doc, receipt);
}

const printReceipt = async (txn: { id?: number; reference?: string }) => {
    if (!txn.id || isPrintingReceipt.value) return;
    isPrintingReceipt.value = true;
    try {
        const response = await tenantClient.get<{ data: ReceiptPayload }>(`/transactions/${txn.id}/receipt`);
        await generateReceiptPdf(response.data.data);
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message || 'Failed to load receipt details.');
    } finally {
        isPrintingReceipt.value = false;
    }
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatCurrency = (amount?: string | number) =>
    formatMoneyValue(amount ?? 0);

// ── Handle member delete ─────────────────────────────────────────────────────
const handleDelete = () => deleteMember(() => router.push('/tenant/members'));

// ── Profile details, grouped into professional sections ──────────────────────
const details = computed<Record<string, unknown>>(() => profileDetails.value?.details ?? {});

function fieldValue(key: string): string | null {
    const v = details.value[key];
    if (v === null || v === undefined || v === '' || v === '—') return null;
    return String(v);
}

const copiedKey = ref<string | null>(null);
function copyField(key: string) {
    const v = fieldValue(key);
    if (!v) return;
    navigator.clipboard?.writeText(v).then(() => {
        copiedKey.value = key;
        setTimeout(() => (copiedKey.value = null), 1500);
    });
}

function badgeClass(value: string): string {
    const s = value.toLowerCase();
    if (['active', 'married', 'approved', 'verified'].includes(s)) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    if (['single', 'standard'].includes(s)) return 'bg-teal-50 text-teal-700 ring-teal-600/20';
    if (['inactive', 'suspended', 'dormant', 'rejected', 'closed'].includes(s)) return 'bg-rose-50 text-rose-700 ring-rose-600/20';
    if (['pending', 'trial'].includes(s)) return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    return 'bg-gray-100 text-gray-600 ring-gray-500/20';
}

interface ProfileField { key: string; label: string; icon: any; type?: 'date' | 'currency' | 'badge' | 'copy' }
interface ProfileSection { title: string; icon: any; fields: ProfileField[] }

const profileSections = computed<ProfileSection[]>(() => [
    {
        title: 'Personal Information', icon: User, fields: [
            { key: 'full_name', label: 'Full Name', icon: User },
            { key: 'memeber_code', label: 'Member Code', icon: Hash, type: 'copy' },
            { key: 'email', label: 'Email Address', icon: Mail },
            { key: 'dob', label: 'Date of Birth', icon: Calendar, type: 'date' },
            { key: 'marital_status', label: 'Marital Status', icon: Heart, type: 'badge' },
            { key: 'from', label: 'Nationality', icon: MapPin },
            { key: 'address', label: 'Address', icon: MapPin },
        ],
    },
    {
        title: 'Contact Information', icon: Phone, fields: [
            { key: 'primary_contact', label: 'Primary Contact', icon: Phone },
            { key: 'o_contact', label: 'Other Contact', icon: Phone },
            { key: 'other_contacts', label: 'Other Contacts', icon: Phone },
            { key: 'MM_number', label: 'Mobile Money', icon: Smartphone },
            { key: 'NIN', label: 'National ID (NIN)', icon: CreditCard },
        ],
    },
    {
        title: 'Next of Kin', icon: Users, fields: [
            { key: 'nokin', label: 'Next of Kin', icon: User },
            { key: 'next_contact', label: 'Next Contact', icon: Phone },
        ],
    },
    {
        title: 'Membership', icon: ShieldCheck, fields: [
            { key: 'status', label: 'Status', icon: ShieldCheck, type: 'badge' },
            { key: 'referred_by', label: 'Referred By', icon: User },
            { key: 'created_by', label: 'Registered By', icon: User },
            { key: 'joined_date', label: 'Joined Date', icon: Calendar, type: 'date' },
            { key: 'created_at', label: 'Created At', icon: Calendar, type: 'date' },
        ],
    },
    {
        title: 'Financial', icon: Wallet, fields: [
            { key: 'initial_deposit', label: 'Initial Deposit', icon: Wallet, type: 'currency' },
            { key: 'opb', label: 'Opening Balance', icon: Wallet, type: 'currency' },
        ],
    },
]);
</script>

<template>
    <!-- Loading state -->
    <div v-if="pageLoading" class="flex items-center justify-center min-h-[60vh]">
        <div class="flex flex-col items-center gap-3">
            <div class="relative h-12 w-12">
                <div class="absolute inset-0 rounded-full border-4 border-[#cda434]/20"></div>
                <div
                    class="absolute inset-0 rounded-full border-4 border-transparent border-t-[#cda434] border-r-[#cda434] animate-spin">
                </div>
                <div class="absolute inset-2 rounded-full bg-[#cda434]/10"></div>
            </div>
            <div class="text-[12px] font-bold uppercase tracking-widest text-[#cda434]">Loading Member Data</div>
        </div>
    </div>

    <div v-else>
        <div class="min-h-screen bg-background text-foreground relative">
            <div class="relative z-10 p-5 flex flex-col lg:flex-row gap-5">

                <!-- Left Sidebar -->
                <MemberSidebar :member="profileDetails?.details ?? {}" :member-initials="memberInitials"
                    :computed-age="computedAge" :upload-processing="uploadProcessing" :format-date="formatDate"
                    @avatar-click="triggerAvatarUpload" />
                <input type="file" ref="avatarInput" @change="handleAvatarUpload" accept="image/*" class="hidden" />

                <!-- Right Main Area -->
                <div class="flex-1 flex flex-col gap-5">

                    <!-- Approval/Rejection banners + action buttons -->
                    <MemberActionBar :member="profileDetails?.details" :approving="approving" :rejecting="rejecting"
                        :deleting="deleting" @deposit="depositDrawer?.open('deposit')"
                        @withdraw="depositDrawer?.open('withdraw')" @approve="approveMember"
                        @reject="(reason) => rejectMember(reason)" @delete="handleDelete" />

                    <!-- Accounts table -->
                    <div v-if="profileDetails?.accounts">

                        <MemberAccountsTable @reload="initialize" :member="profileDetails?.details ?? {}"
                            :accounts="profileDetails.accounts ?? []" :currency-code="currencyCode"
                            :format-currency="formatCurrency" @new-account="newAccountDrawer?.openDrawer()"
                            @custom-fee="(account) => customFeeDrawer?.openDrawer(account)" /> 
                    </div>

                    <!-- Tabs -->
                    <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                        <!-- Tab bar -->
                        <div class="flex overflow-x-auto border-b border-gray-100 px-4">
                            <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="['relative flex items-center gap-2 px-4 py-4 text-[13px] font-bold transition-colors whitespace-nowrap',
                                activeTab === tab.id ? 'text-[#cda434]' : 'text-[#788896] hover:text-gray-900']">
                                <component :is="tab.icon" :size="16" />
                                {{ tab.label }}
                                <span v-if="tab.count !== null"
                                    class="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-md text-[11px] font-bold font-mono bg-gray-100 text-[#788896]">
                                    {{ tab.count }}
                                </span>
                                <div v-if="activeTab === tab.id"
                                    class="absolute bottom-0 left-4 right-4 h-[3px] bg-[#cda434] rounded-t-full"></div>
                            </button>
                        </div>

                        <!-- Profile tab — compact masonry, no scrolling -->
                        <div v-show="activeTab === 'profile'" class="p-4 bg-gray-50/40">
                            <div class="columns-1 md:columns-2 xl:columns-3 gap-4">
                                <section v-for="section in profileSections" :key="section.title"
                                    class="break-inside-avoid mb-4 rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                                    <!-- Section header -->
                                    <div class="flex items-center gap-2 px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/50">
                                        <div class="size-6 rounded-md bg-[#cda434]/10 flex items-center justify-center shrink-0">
                                            <component :is="section.icon" :size="13" class="text-[#cda434]" />
                                        </div>
                                        <h3 class="text-[14px] font-bold text-gray-800 uppercase tracking-wide">{{ section.title }}</h3>
                                    </div>

                                    <!-- Fields — inline label/value rows -->
                                    <div class="divide-y divide-gray-50">
                                        <div v-for="f in section.fields" :key="f.key"
                                            class="flex items-start justify-between gap-3 px-3.5 py-2">
                                            <span class="flex items-center gap-1.5 text-[14px] font-medium text-gray-400 shrink-0 pt-px">
                                                <component :is="f.icon" :size="12" class="shrink-0" />
                                                {{ f.label }}
                                            </span>

                                            <div class="min-w-0 text-right">
                                                <!-- Badge -->
                                                <template v-if="f.type === 'badge'">
                                                    <span v-if="fieldValue(f.key)"
                                                        :class="['inline-flex items-center rounded-full px-2 py-0.5 text-[14px] font-bold capitalize ring-1 ring-inset', badgeClass(fieldValue(f.key)!)]">
                                                        {{ fieldValue(f.key) }}
                                                    </span>
                                                    <span v-else class="text-[14px] text-gray-300">—</span>
                                                </template>

                                                <!-- Copy -->
                                                <div v-else-if="f.type === 'copy'" class="flex items-center justify-end gap-1.5">
                                                    <span class="text-[14px] font-bold text-gray-900 font-mono truncate">{{ fieldValue(f.key) ?? '—' }}</span>
                                                    <button v-if="fieldValue(f.key)" @click="copyField(f.key)"
                                                        class="shrink-0 text-gray-400 hover:text-[#cda434] transition-colors" title="Copy">
                                                        <component :is="copiedKey === f.key ? Check : Copy" :size="13"
                                                            :class="copiedKey === f.key ? 'text-emerald-500' : ''" />
                                                    </button>
                                                </div>

                                                <!-- Currency -->
                                                <span v-else-if="f.type === 'currency'" class="text-[14px] font-bold text-gray-900">
                                                    <template v-if="fieldValue(f.key) !== null">{{ currencyCode }} {{ formatCurrency(fieldValue(f.key)!) }}</template>
                                                    <span v-else class="text-gray-300">—</span>
                                                </span>

                                                <!-- Date -->
                                                <span v-else-if="f.type === 'date'" class="text-[14px] font-bold text-gray-900">
                                                    {{ fieldValue(f.key) ? formatDate(fieldValue(f.key)!) : '—' }}
                                                </span>

                                                <!-- Text -->
                                                <span v-else class="text-[14px] font-bold text-gray-900 break-words">
                                                    <template v-if="fieldValue(f.key)">{{ fieldValue(f.key) }}</template>
                                                    <span v-else class="text-gray-300">—</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        <!-- Transactions tab -->
                        <MemberTransactionsTab v-show="activeTab === 'transactions'" :transactions="member.transactions"
                            mode="all" action-color="bg-[#cda434]" :format-date="formatDate" :show-table="false"
                            :format-date-time="formatDateTime" :format-currency="formatCurrency" @print="printReceipt"
                            @reverse="confirmDeleteTxn" />

                        <!-- Savings tab -->
                        <MemberTransactionsTab v-show="activeTab === 'savings'" :transactions="member.transactions"
                            mode="deposit" action-color="bg-[#16a34a]" :show-account-column="true" :show-table="false"
                            :format-date="formatDate" :format-date-time="formatDateTime"
                            :format-currency="formatCurrency" @print="printReceipt" @reverse="confirmDeleteTxn"
                            @open-drawer="depositDrawer?.open('deposit')" />

                        <!-- Withdrawal tab -->
                        <MemberTransactionsTab v-show="activeTab === 'withdrawal'" :transactions="member.transactions"
                            mode="withdrawal" action-color="bg-[#ea580c]" :show-account-column="true" :show-table="false"
                            :format-date="formatDate" :format-date-time="formatDateTime"
                            :format-currency="formatCurrency" @print="printReceipt" @reverse="confirmDeleteTxn"
                            @open-drawer="depositDrawer?.open('withdraw')" />

                        <MemberTransactionsTab v-show="activeTab === 'shares'" :transactions="member.transactions"
                            mode="share-transaction" action-color="bg-[#ea580c]" :show-account-column="true" :show-table="false"
                            :format-date="formatDate" :format-date-time="formatDateTime"
                            :format-currency="formatCurrency" @print="printReceipt" @reverse="confirmDeleteTxn"
                            @open-drawer="depositDrawer?.open('withdraw')" />
                        <MemberLoansTab :loans="member.loans" v-if="activeTab === 'loans'" :formatDate="formatDate"
                            :formatDateTime="formatDateTime" :formatCurrency="formatCurrency" actionColor="bg-[#cda434]"
                            @view="() => { }" />
                            
                        <Statement v-if="activeTab === 'statement'" :profileDetails="profileDetails" :data="member" :formatDate="formatDate"
                            :formatDateTime="formatDateTime" :formatCurrency="formatCurrency" actionColor="bg-[#cda434]"
                            @view="() => { }" />


                        <!-- Shares placeholder -->
                        <!-- <div v-show="activeTab === 'shares'" class="p-12 text-center">
                            <div
                                class="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center mx-auto mb-3">
                                <BarChart3 :size="20" class="text-[#64748b]" />
                            </div>
                            <h4 class="text-[15px] font-bold text-[#0f172a]">Shares History</h4>
                            <p class="text-[13px] text-[#64748b] mt-1 max-w-sm mx-auto">Track and manage member shares,
                                certificates, and
                                dividends here.</p>
                        </div> -->

                        <!-- Loans placeholder -->
                        <!-- <div v-show="activeTab === 'loans'" class="p-12 text-center">
                            <div
                                class="w-12 h-12 rounded-full bg-[#eff6ff] flex items-center justify-center mx-auto mb-3">
                                <Wallet :size="20" class="text-[#2563eb]" />
                            </div>
                            <h4 class="text-[15px] font-bold text-[#0f172a]">Loans Management</h4>
                            <p class="text-[13px] text-[#64748b] mt-1 max-w-sm mx-auto">Manage loan applications,
                                disbursements, and repayments
                                for this member.</p>
                        </div> -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Drawers -->
        <DepositWithdrawDrawer ref="depositDrawer" :member="member" :currency-code="currencyCode"
            :current-balance="currentBalance" @success="fetchMember(true)" />

        <!-- <NewAccountDrawer ref="newAccountDrawer" :member-id="member.id" :savings-accounts="member.savings_accounts"
            :savings-products="savingsProducts" :currency-code="currencyCode" @success="fetchMember(true)" /> -->

        <CustomFeeDrawer ref="customFeeDrawer" :currency-code="currencyCode" @success="fetchMember(true)" />

        <Transition name="fade">
            <div v-if="showTxnDeleteDialog" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showTxnDeleteDialog = false">
                </div>
                <div
                    class="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:border dark:border-neutral-800">
                    <div class="flex items-start gap-4">
                        <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <RotateCcw :size="20" class="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <!-- <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Reverse Transaction
                            </h3> -->
                            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Reverse transaction <strong class="text-neutral-700 dark:text-neutral-200">{{txnToDelete?.reference }}</strong>?
                            </p>
                            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                <textarea class="w-full"  placeholder="Enter  a reason for the reversal" v-model="formData.reason" rows="2" />
                            </p>
                            <p class="mt-2 text-[12px] text-neutral-400 dark:text-neutral-500">
                                A counter-transaction will be created to undo this entry. The original transaction
                                remains
                                in the audit trail marked as <em>reversed</em>.
                            </p>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button @click="showTxnDeleteDialog = false"
                            class="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                            Cancel
                        </button>
                        <button @click="executeDeleteTxn" :disabled="isDeletingTxn"
                            class="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors disabled:opacity-50">
                            <span v-if="isDeletingTxn"
                                class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
                            <RotateCcw v-else :size="14" />
                            Confirm Reversal
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
