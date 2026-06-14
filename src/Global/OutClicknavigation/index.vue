<template>
    <div v-bind="$attrs" class="flex flex-col h-full py-1">
        <div class="flex flex-col gap-1.5 flex-1">
            <template v-for="item in mainLinks" :key="item.path ?? item.label">

                <!-- Section label -->
                <SidebarGroupLabel
                    v-if="item.type === 'label' && item?.showSideBar === true"
                    class="flex h-5 shrink-0 items-center mt-5 mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 group-data-[collapsible=icon]:hidden">
                    {{ item.label }}
                </SidebarGroupLabel>

                <!-- Regular nav link (no children) -->
                <span v-else-if="!item?.children && item?.showSideBar === true">
                    <RouteLink :item="item" :prifix="prefix" :badge="getBadge(item)" @click="() => toggleSubmenu(null)" />
                </span>

                <!-- Expandable nav item (has children / submenu) -->
                <div v-else-if="item?.showSideBar === true" class="relative">
                    <div v-auth="item?.permissions" @click="toggleSubmenu(item.label ?? null)"
                        :class="[
                            'flex items-center gap-3 w-full px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group',
                            Store.showSubmenu === item?.label
                                ? 'bg-white/10 text-white'
                                : 'text-white/55 hover:text-white hover:bg-white/8'
                        ]">
                        <component :is="item.icon" :size="18" class="shrink-0" />
                        <span v-if="state === 'expanded'" class="flex-1 text-[13px] font-medium capitalize">{{ item.label }}</span>
                        <component
                            v-if="state === 'expanded'"
                            :is="Store.showSubmenu === item?.label ? ChevronDown : ChevronRight"
                            :size="14"
                            class="text-white/30 transition-transform duration-200"
                        />
                    </div>

                    <!-- Submenu flyout -->
                    <Transition name="flyout">
                        <div v-if="Store.showSubmenu === item?.label && item?.children"
                            class="absolute left-full top-0 ml-2 z-9999">
                            <!-- Arrow notch pointing back to sidebar trigger -->
                            <div class="flyout-notch"></div>
                            <!-- Panel -->
                            <div class="flyout-panel w-72">
                                <!-- Animated accent bar -->
                                <div class="flyout-accent"></div>
                                <!-- Sections -->
                                <template v-for="(child, index) in item.children" :key="index">
                                    <div v-auth="child?.permissions"
                                        class="flex flex-col py-2.5"
                                        :class="index > 0 ? 'border-t border-neutral-100 dark:border-neutral-800' : ''">
                                        <!-- Section label: dot + small-caps (replaces heavy pill) -->
                                        <div class="flex items-center gap-2 px-3 pt-1 pb-1.5">
                                            <span class="size-[5px] rounded-full shrink-0"
                                                :style="child.titleStyle === 'green' ? 'background:#0050D8' : 'background:#818cf8'">
                                            </span>
                                            <span class="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
                                                {{ child.title }}
                                            </span>
                                        </div>
                                        <!-- Items -->
                                        <div class="px-2">
                                            <RouteLink :prifix="item.prifix" :item="child.items" :title="child.title"
                                                @click="toggleSubmenu(null)" />
                                        </div>
                                    </div>
                                </template>
                                <!-- Footer: keyboard hint -->
                                <div class="flyout-footer">
                                    <kbd class="flyout-kbd">Esc</kbd>
                                    <span class="text-[11px] text-neutral-400 dark:text-neutral-500">to close</span>
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>

            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { ChevronDown, ChevronRight } from 'lucide-vue-next';

defineOptions({ inheritAttrs: false })
import RouteLink from "./RouteLink.vue";
import { SidebarGroupLabel, useSidebar } from '@/Global';
import { pomPinia } from 'septor-store';
import type { MenuRoutes } from '@/Global/types/helpers';

const props = defineProps<{
    links: MenuRoutes[]
    prefix?: string
}>();

const Store = pomPinia() as any;
const { state } = useSidebar()

const mainLinks = computed(() => props.links)

function getBadge(item: any): number | null {
    if (!item?.badgeKey) return null
    const keys = (item.badgeKey as string).split('.')
    let val: any = Store
    for (const key of keys) {
        val = val?.[key]
        if (val === undefined || val === null) return null
    }
    return typeof val === 'number' && val > 0 ? val : null
}

const toggleSubmenu = (label: string | undefined | null) => {
    if (Store.showSubmenu === label) {
        Store.showSubmenu = null
    } else {
        Store.showSubmenu = label
    }
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') toggleSubmenu(null)
}

onMounted(() => {
    window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.hover\:bg-white\/8:hover {
    background-color: rgba(255, 255, 255, 0.08);
}

/* ── Flyout panel ─────────────────────────────────────── */
.flyout-panel {
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 20px;
    overflow: hidden;
    box-shadow:
        0 0 0 1px rgba(0,0,0,0.03),
        0 4px 6px rgba(0,0,0,0.04),
        0 12px 30px rgba(0,0,0,0.10),
        0 32px 64px rgba(0,0,0,0.08);
}
:global(.dark) .flyout-panel {
    background: #171717;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow:
        0 0 0 1px rgba(255,255,255,0.04),
        0 4px 6px rgba(0,0,0,0.2),
        0 12px 30px rgba(0,0,0,0.4),
        0 32px 64px rgba(0,0,0,0.3);
}

/* Arrow notch — points left back to the sidebar trigger */
.flyout-notch {
    position: absolute;
    left: -5px;
    top: 22px;
    width: 10px;
    height: 10px;
    background: white;
    border-left: 1px solid rgba(0, 0, 0, 0.07);
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    transform: rotate(45deg);
    border-radius: 2px 0 0 0;
    z-index: 1;
}
:global(.dark) .flyout-notch {
    background: #171717;
    border-color: rgba(255, 255, 255, 0.08);
}

/* Animated brand accent bar at top of panel */
.flyout-accent {
    height: 3px;
    background: linear-gradient(90deg, #0050D8, #818cf8, #0050D8);
    background-size: 200% 100%;
    animation: accent-shimmer 3s ease infinite;
}
@keyframes accent-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Footer: Esc keyboard hint */
.flyout-footer {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px 9px;
    border-top: 1px solid #f3f4f6;
}
:global(.dark) .flyout-footer {
    border-top-color: rgba(255, 255, 255, 0.06);
}
.flyout-kbd {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    color: #6b7280;
    font-family: inherit;
    letter-spacing: 0.01em;
}
:global(.dark) .flyout-kbd {
    border-color: rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: #9ca3af;
}

/* ── Transition: slide-in from sidebar ───────────────── */
.flyout-enter-active {
    animation: flyout-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.flyout-leave-active {
    animation: flyout-in 0.12s ease reverse both;
}
@keyframes flyout-in {
    from { opacity: 0; transform: translateX(-8px) scale(0.97); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
}
</style>
