export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at?: string;
    [key: string]: unknown;
}

export interface Tenant {
    id: number;
    name: string;
    slug: string;
    domain: string;
    settings?: {
        logo_url?: string;
        slogan?: string;
        address?: string;
        email?: string;
        [key: string]: unknown;
    };
}

export type BreadcrumbItem = {
    title: string;
    href?: string;
};

export type NavItem = {
    title: string;
    href: string;
    icon?: any; // LucideIcon from lucide-vue-next
    isActive?: boolean;
};

export type Appearance = 'light' | 'dark' | 'system';
export type ResolvedAppearance = 'light' | 'dark';

export type AppShellVariant = 'header' | 'sidebar';

export type TwoFactorConfigContent = {
    enabled: boolean;
    qr_code?: string;
    secret?: string;
    recovery_codes?: string[];
};
