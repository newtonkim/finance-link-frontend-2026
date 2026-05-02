# My Profile Page Redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the `tenant/my-profile` page with a professional sidebar-anchored layout and wire up all currently broken or placeholder functionality (Edit Profile drawer, avatar upload, inline password change).

**Architecture:** Two-column layout — enriched sticky sidebar (identity card + nav) on the left, tab content on the right. All state extensions go into the existing `profileStore`. One new backend endpoint required for avatar upload.

**Tech Stack:** Vue 3 `<script setup>`, Pinia, Tailwind CSS, shadcn-vue (Sheet, Card, Button, Badge, Separator, Skeleton), lucide-vue-next, existing `staffApi` + `branchApi`.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/tenant/modules/profile/pages/MyProfile.vue` | Main page — layout, tab routing, compose sub-components |
| Create | `src/tenant/modules/profile/components/ProfileSidebar.vue` | Sticky sidebar: avatar, identity card, nav links, Edit Profile button |
| Create | `src/tenant/modules/profile/components/ProfileOverviewTab.vue` | Stat cards + Professional Profile card |
| Create | `src/tenant/modules/profile/components/ProfilePermissionsTab.vue` | Permission groups display |
| Create | `src/tenant/modules/profile/components/ProfileSecurityTab.vue` | Inline expandable password form + sessions |
| Create | `src/tenant/modules/profile/components/EditProfileDrawer.vue` | Sheet-based slide-over for editing name/email |
| Modify | `src/stores/profileStore.ts` | Add `isUpdating`, `isUploadingAvatar`, `updateProfile()`, `uploadAvatar()`, `changePassword()`, branch resolution |
| Modify | `src/tenant/apis/staff/api.ts` | Add `uploadAvatar(id, file)` method |

---

## Section 1: Layout

### Page Structure
The full-width hero header is removed. The page uses a `grid grid-cols-12` layout:

- **Left sidebar** — `col-span-3`, sticky (`sticky top-6`), contains the full profile identity and navigation
- **Right content** — `col-span-9`, tab content area with Sync Data button at top-right

```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │  SIDEBAR (3/12) │  │  CONTENT AREA (9/12)     │  │
│  │                 │  │                          │  │
│  │  [Avatar]  ●    │  │  [Sync Data]  ←top-right │  │
│  │  John Jage      │  │                          │  │
│  │  [Admin badge]  │  │  ┌────┐ ┌────┐ ┌────┐   │  │
│  │  Branch: HQ     │  │  │Stat│ │Stat│ │Stat│   │  │
│  │  ─────────────  │  │  └────┘ └────┘ └────┘   │  │
│  │  ○ Overview     │  │                          │  │
│  │  ○ Permissions  │  │  ┌──────────────────┐   │  │
│  │  ○ Security     │  │  │ Professional Card │   │  │
│  │                 │  │  └──────────────────┘   │  │
│  │  [Edit Profile] │  │                          │  │
│  └─────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Section 2: Components

### ProfileSidebar.vue
**Props:** `profile`, `activeTab`, `onTabChange`, `onEditClick`

**Avatar:**
- `size-20 rounded-2xl` with gradient background seeded deterministically from `profile.name` (using a simple char-code sum to pick from a fixed palette of 6 gradients)
- Shows initials (`name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()`) when no avatar
- Shows `<img>` when avatar URL present
- On hover: camera icon overlay (`opacity-0 group-hover:opacity-100 transition-opacity`) triggers hidden `<input type="file" accept="image/*">`
- Bottom-right: animated green dot (`size-3 bg-emerald-500 animate-pulse rounded-full`) for active status

**Identity block:**
```
[Avatar with camera overlay]  ← clickable for upload
John Jage                     ← text-xl font-black
[Admin]                       ← nfuko-yellow badge
📍 Main Branch                ← muted text, resolved branch name
```

**Navigation links:**
```html
<button
  v-for="tab in tabs"
  :class="activeTab === tab.id
    ? 'border-l-2 border-nfuko-action text-nfuko-primary bg-white pl-4 font-bold'
    : 'pl-4 text-neutral-500 hover:text-neutral-900'"
>
```
Active state uses a `border-l-2 border-nfuko-action` left accent instead of a filled background.

**Edit Profile button:** `variant="outline"` full-width at the bottom of the sidebar. Emits `onEditClick` to open the drawer.

**Loading state:** When `isLoading` is true, replace identity block with `<Skeleton>` lines (avatar shimmer, two text lines).

---

### ProfileOverviewTab.vue
**Props:** `profile`

**Stat cards — 3-column grid:**

| Card | Icon | Color accent | Value |
|------|------|-------------|-------|
| Status | `CheckCircle2` | `border-l-4 border-emerald-500` | `profile.status` (capitalized) |
| Member Since | `Calendar` | `border-l-4 border-indigo-500` | `formatDateUs(profile.staff_data?.created_at)` |
| Access Level | `ShieldCheck` | `border-l-4 border-violet-500` | `profile.is_tenant_admin ? 'Admin' : 'Staff'` |

Cards use `border-l-4` accent instead of icon background squares — cleaner visual hierarchy.

**Professional Profile card:**

| Label | Value | Source |
|-------|-------|--------|
| Designation | `profile.role` | API |
| Staff ID | `#{{ profile.id }}` | API |
| Email Address | `profile.email` | API |
| Branch | Resolved branch name | `branchApi` via store |
| Capabilities | Pill badges | `can_vote_on_loans`, `can_manage_branch`, `can_finalise_loan` |

Capabilities rendering:
```html
<Badge
  v-for="cap in capabilities"
  :class="cap.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-400'"
>
  {{ cap.label }}
</Badge>
```
Where `capabilities` is a computed from `profile.staff_data`:
```ts
const capabilities = computed(() => [
  { label: 'Vote on Loans', enabled: profile.value.staff_data?.can_vote_on_loans },
  { label: 'Manage Branch', enabled: profile.value.staff_data?.can_manage_branch },
  { label: 'Finalise Loans', enabled: profile.value.staff_data?.can_finalise_loan },
])
```

**Removed:** The hardcoded "Full-time" employment status field — no such field exists in the `Staff` interface.

---

### ProfilePermissionsTab.vue
**Props:** `permissionGroups`

No structural change from current — keeps the grid of permission groups with badges. Visual improvement: group header uses `text-nfuko-action` color instead of neutral-400, and badges get `bg-nfuko-primary/5 text-nfuko-primary` in light mode.

---

### ProfileSecurityTab.vue
**Props:** `profile`
**Emits:** none (manages its own local state)

**Password section:**
```ts
const showPasswordForm = ref(false)
const passwordForm = reactive({ current: '', next: '', confirm: '' })
const passwordError = ref('')
const isSaving = ref(false)
```

When `showPasswordForm` is false: shows the static row with "Update Password" button.
When `showPasswordForm` is true: expands inline form below the row:
```
Current Password    [________________]
New Password        [________________]
Confirm Password    [________________]
[error message if any]
[Change Password]  [Cancel ×]
```

Submit calls `profileStore.changePassword(current, next)`. On success: toast + collapse form + clear fields. On failure: set `passwordError` (shown inline below the form, not as a toast).

**Sessions section:** Remains as placeholder static UI (current browser / active now). No real session data in the current backend — mark with a `<!-- TODO: wire up real sessions API -->` comment.

---

### EditProfileDrawer.vue
**Props:** `open`, `profile`
**Emits:** `update:open`, `saved`

Uses `Sheet` / `SheetContent` from shadcn-vue, `side="right"`, `class="w-[420px]"`.

**Fields:**
| Field | Editable | Note |
|-------|----------|------|
| Name | ✅ Yes | `<Input>` |
| Email | ❌ Read-only | Label: "Contact your admin to change" |
| Role | ❌ Read-only | Display only |

**Save:** Calls `profileStore.updateProfile({ name: form.name })`. Button shows spinner (`isUpdating`). On success: emit `saved`, close drawer, toast "Profile updated." On failure: toast error, drawer stays open.

---

## Section 3: Data Flow & State

### profileStore.ts additions

```ts
const isUpdating = ref(false)
const isUploadingAvatar = ref(false)
const branchName = ref<string | null>(null)

async function resolveBranchName(branchId: number | null) {
  if (!branchId) return
  try {
    const { data } = await branchApi.list()
    const branches = data.data || data
    const match = branches.find((b: any) => b.id === branchId)
    branchName.value = match?.name || null
  } catch {
    branchName.value = null
  }
}

async function updateProfile(data: Partial<Staff>) {
  isUpdating.value = true
  try {
    const id = staffDetails.value?.id
    if (!id) throw new Error('No staff ID')
    await staffApi.update(id, data)
    staffDetails.value = { ...staffDetails.value!, ...data }
  } finally {
    isUpdating.value = false
  }
}

async function uploadAvatar(file: File) {
  isUploadingAvatar.value = true
  try {
    const id = staffDetails.value?.id
    if (!id) throw new Error('No staff ID')
    const { data } = await staffApi.uploadAvatar(id, file)
    // Update the auth store avatar so the topbar also reflects the change
    if (tenantUserStore.user) {
      tenantUserStore.user.avatar = data.avatar_url
    }
  } finally {
    isUploadingAvatar.value = false
  }
}

async function changePassword(currentPassword: string, newPassword: string) {
  const id = staffDetails.value?.id
  if (!id) throw new Error('No staff ID')
  await staffApi.update(id, { password: newPassword })
  // Backend is responsible for validating current password
}
```

`fetchFullProfile()` is updated to also call `resolveBranchName(staffDetails.value?.branch_id)` after fetching staff details.

### staffApi.ts addition

```ts
uploadAvatar(id: number, file: File) {
  const form = new FormData()
  form.append('avatar', file)
  return tenantClient.post(`/staff/${id}/avatar`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
},
```

### Backend dependency

The `POST /api/v1/tenant/staff/{id}/avatar` endpoint does not exist yet. The frontend will be built assuming it returns `{ avatar_url: string }`. This endpoint must be added to the backend before avatar upload is live. Until then, the upload UI is wired but will get a 404 — caught by the `uploadAvatar` error handler which reverts the preview.

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| `fetchFullProfile` staff fetch fails | Silent (no toast) — page still renders from auth store data |
| `updateProfile` fails | Toast error, drawer stays open |
| `uploadAvatar` fails | Toast error, avatar preview reverts to previous state |
| `changePassword` fails | Inline error below the form fields (not a toast) |
| Branch resolution fails | `branchName` stays null, sidebar shows nothing for branch line |

---

## Loading States

- **Page mount:** `isLoading` true → sidebar identity replaced with `<Skeleton>` (avatar shimmer + 2 text line shimmers), stat cards replaced with shimmer cards
- **Save profile:** `isUpdating` true → "Save Changes" button disabled + spinner
- **Avatar upload:** `isUploadingAvatar` true → avatar shows spinner overlay, camera icon hidden
- **Password change:** local `isSaving` true → "Change Password" button disabled + spinner

---

## What Is NOT in Scope

- Real active sessions list (no backend API exists)
- Role editing (admin-only operation, not self-service)
- Email editing (requires re-authentication flow)
- Two-factor authentication
- Notification preferences
