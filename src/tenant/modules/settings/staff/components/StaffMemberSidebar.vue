<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Edit, Star } from 'lucide-vue-next'

defineProps<{
  member: {
    id: number
    name: string
    salutation: string
    phone: string
    email?: string
    avatar_url?: string | null
    gender?: string
    marital_status?: string
    dob?: string
    id_number?: string
    joined_at?: string
    created_at?: string
    mobile_money_number?: string
    nationality?: string
  }
  memberInitials: string
  computedAge: string
  uploadProcessing: boolean
  formatDate: (d?: string) => string
}>()

const emit = defineEmits<{ avatarClick: [] }>()
</script>

<template>
  <div class="w-full lg:w-[280px] shrink-0 flex flex-col gap-4">
    <!-- Member Card -->
    <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <!-- Banner -->
      <div class="relative h-16 bg-gradient-to-r from-[#001d21] via-[#003d3d] to-[#001d21] overflow-hidden">
        <div class="absolute inset-0 opacity-20"
          style="background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(201,168,76,0.15) 10px, rgba(201,168,76,0.15) 11px);">
        </div>
        <div class="absolute top-3 left-1/2 -translate-x-1/2">
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-bg-nfuko-yellow/20 text-bg-nfuko-yellow border border-bg-nfuko-yellow/30">
            <Star :size="10" fill="currentColor" />
            STANDARD
          </span>
        </div>
      </div>

      <!-- Avatar -->
      <div class="flex justify-center -mt-10 relative z-10">
        <div @click="emit('avatarClick')"
          class="w-[72px] h-[72px] rounded-full border-[3px] border-bg-nfuko-yellow bg-card flex items-center justify-center overflow-hidden cursor-pointer group relative shadow-lg shadow-bg-nfuko-yellow/10">
          <img v-if="member.avatar_url" :src="member.avatar_url" alt="Avatar" class="w-full h-full object-cover" />
          <span v-else class="text-xl font-bold text-bg-nfuko-yellow">{{ memberInitials }}</span>
          <div v-if="uploadProcessing" class="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
          </div>
        </div>
      </div>

      <!-- Member info -->
      <div class="px-4 pt-3 pb-2 text-center">
        <h2 class="text-[15px] font-bold text-foreground">{{ member.salutation }} {{ member.name }}</h2>
        <p class="text-[11px] text-muted-foreground mt-0.5">{{ member.phone }}</p>
        <p class="text-[11px] text-muted-foreground">{{ member.email || '—' }}</p>
        <div class="mt-2">
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/20">
            <span class="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
            ACTIVE MEMBER
          </span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="mx-4 mb-4 mt-2 border border-border rounded-lg overflow-hidden">
        <div class="grid grid-cols-2">
          <div class="p-3 border-r border-b border-border">
            <span class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Shares</span>
            <span class="text-[15px] font-bold text-foreground">0.0</span>
          </div>
          <div class="p-3 border-b border-border">
            <span class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Gender</span>
            <span class="text-[15px] font-bold text-foreground capitalize">{{ member.gender || '—' }}</span>
          </div>
          <div class="p-3 border-r border-border">
            <span class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Marital</span>
            <span class="text-[15px] font-bold text-foreground capitalize">{{ member.marital_status || '—' }}</span>
          </div>
          <div class="p-3">
            <span class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Age</span>
            <span class="text-[15px] font-bold text-foreground">{{ computedAge }}</span>
          </div>
        </div>
      </div>

      <!-- Edit Profile Button -->
      <div class="px-4 pb-4">
        <RouterLink :to="`/members/${member.id}/edit`"
          class="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[12px] font-semibold text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-all">
          <Edit :size="13" />
          Edit Profile
        </RouterLink>
      </div>
    </div>

    <!-- Quick Info Card -->
    <div class="bg-card border border-border rounded-xl p-4 shadow-sm">
      <h3 class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Info</h3>
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-[12px] text-muted-foreground">Date of Birth</span>
          <span class="text-[12px] font-semibold text-foreground font-mono">{{ formatDate(member.dob).replace(/,/g, '') }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-[12px] text-muted-foreground">National ID</span>
          <span class="text-[12px] font-semibold text-foreground font-mono">{{ member.id_number || '—' }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-[12px] text-muted-foreground">Date Joined</span>
          <span class="text-[12px] font-semibold text-foreground font-mono">{{ formatDate(member.joined_at || member.created_at).replace(/,/g, '') }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-[12px] text-muted-foreground">Mobile Money</span>
          <span class="text-[12px] font-semibold text-foreground font-mono">{{ member.mobile_money_number || '—' }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-[12px] text-muted-foreground">Nationality</span>
          <span class="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
            <span>🇺🇬</span> {{ member.nationality || 'Uganda' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
