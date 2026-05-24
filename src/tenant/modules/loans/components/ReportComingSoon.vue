<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  title: string
  subtitle?: string
  icon?: string
}>()

const router = useRouter()
</script>

<template>
  <div class="report-coming-soon">
    <!-- Animated background bars -->
    <div class="bars-bg" aria-hidden="true">
      <span v-for="n in 12" :key="n" class="bar" :style="`--i:${n}`" />
    </div>

    <!-- Grid overlay -->
    <div class="grid-overlay" aria-hidden="true" />

    <!-- Content -->
    <div class="content-wrap">
      <!-- Badge -->
      <div class="badge">
        <span class="badge-dot" />
        <span class="badge-text">COMING SOON</span>
      </div>

      <!-- Icon ring -->
      <div class="icon-ring">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg">
          <rect x="8" y="36" width="8" height="20" rx="2" fill="#FCDC04" opacity="0.9"/>
          <rect x="20" y="26" width="8" height="30" rx="2" fill="#ffffff" opacity="0.8"/>
          <rect x="32" y="16" width="8" height="40" rx="2" fill="#FCDC04" opacity="0.7"/>
          <rect x="44" y="30" width="8" height="26" rx="2" fill="#ffffff" opacity="0.5"/>
          <path d="M6 54 L58 54" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
          <path d="M14 10 L26 20 L38 8 L50 18" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
        </svg>
        <div class="ring-pulse" />
      </div>

      <!-- Title -->
      <h1 class="report-title">{{ title }}</h1>

      <!-- Divider -->
      <div class="divider">
        <span class="divider-line" />
        <span class="divider-diamond" />
        <span class="divider-line" />
      </div>

      <!-- Description -->
      <p class="description">
        {{ subtitle ?? 'This report is currently under development. Our team is building powerful analytics to give you deep insight into your loan portfolio.' }}
      </p>

      <!-- Progress bar -->
      <div class="progress-wrap">
        <div class="progress-label">
          <span>In Development</span>
          <span class="progress-pct">Building…</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" />
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button class="btn-back" @click="router.back()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M5 12l7 7M5 12l7-7"/>
          </svg>
          Go Back
        </button>
        <span class="eta-badge">Est. Q3 2026</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');

/* ── Layout ── */
.report-coming-soon {
  position: relative;
  min-height: calc(100vh - 4rem);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1d4780;
  overflow: hidden;
  padding: 3rem 1.5rem;
}

/* ── Background bars ── */
.bars-bg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: clamp(8px, 2vw, 28px);
  padding: 0 4%;
  pointer-events: none;
}
.bar {
  flex: 1;
  max-width: 56px;
  border-radius: 4px 4px 0 0;
  background: linear-gradient(to top, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
  animation: bar-pulse 3s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.22s);
}
.bar:nth-child(odd)  { height: clamp(60px, 14vh, 180px); }
.bar:nth-child(even) { height: clamp(100px, 22vh, 280px); }
.bar:nth-child(3n)   { height: clamp(80px, 18vh, 240px); background: linear-gradient(to top, rgba(252,220,4,0.12), rgba(255,255,255,0.02)); }
.bar:nth-child(4n)   { height: clamp(50px, 10vh, 140px); }

@keyframes bar-pulse {
  0%, 100% { opacity: 0.35; transform: scaleY(1); }
  50%       { opacity: 0.65; transform: scaleY(1.06); }
}

/* ── Grid overlay ── */
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

/* ── Glass card ── */
.content-wrap {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: rgba(10, 35, 24, 0.72);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 24px;
  padding: clamp(2rem, 5vw, 3.5rem) clamp(2rem, 6vw, 4.5rem);
  max-width: 560px;
  width: 100%;
  box-shadow:
    0 0 0 1px rgba(252,220,4,0.04),
    0 32px 80px rgba(0,0,0,0.5),
    0 0 120px rgba(255,255,255,0.03) inset;
  animation: card-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Badge ── */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 999px;
  background: rgba(252,220,4,0.1);
  border: 1px solid rgba(252,220,4,0.3);
  margin-bottom: 2rem;
  animation: badge-in 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes badge-in {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #FCDC04;
  animation: dot-blink 1.4s ease-in-out infinite;
}
@keyframes dot-blink {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(252,220,4,0.4); }
  50%       { opacity: 0.6; box-shadow: 0 0 0 5px rgba(252,220,4,0); }
}
.badge-text {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.2em;
  color: #FCDC04;
}

/* ── Icon ring ── */
.icon-ring {
  position: relative;
  width: 88px;
  height: 88px;
  margin-bottom: 1.75rem;
  animation: icon-in 0.6s 0.2s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes icon-in {
  from { opacity: 0; transform: scale(0.7) rotate(-8deg); }
  to   { opacity: 1; transform: scale(1) rotate(0deg); }
}
.icon-svg {
  width: 88px;
  height: 88px;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 0 16px rgba(255,255,255,0.15));
}
.ring-pulse {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,0.2);
  animation: ring-expand 2.2s ease-out infinite;
}
@keyframes ring-expand {
  0%   { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(1.4); opacity: 0; }
}

/* ── Title ── */
.report-title {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  color: #ffffff;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 1.25rem;
  animation: title-in 0.6s 0.3s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes title-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Divider ── */
.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 280px;
  margin-bottom: 1.25rem;
  animation: fade-in 0.5s 0.4s both;
}
.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
}
.divider-diamond {
  width: 6px;
  height: 6px;
  background: #ffffff;
  transform: rotate(45deg);
  opacity: 0.5;
  flex-shrink: 0;
}

/* ── Description ── */
.description {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #ffffff;
  max-width: 380px;
  margin: 0 0 2rem;
  animation: fade-in 0.5s 0.45s both;
}

/* ── Progress ── */
.progress-wrap {
  width: 100%;
  margin-bottom: 2rem;
  animation: fade-in 0.5s 0.55s both;
}
.progress-label {
  display: flex;
  justify-content: space-between;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  margin-bottom: 8px;
  letter-spacing: 0.06em;
}
.progress-pct {
  color: #ffffff;
  animation: text-blink 2s ease-in-out infinite;
}
@keyframes text-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
.progress-track {
  height: 4px;
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  width: 42%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ffffff, #FCDC04);
  position: relative;
  animation: progress-shimmer 2.5s ease-in-out infinite;
}
.progress-fill::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 40px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
  animation: shimmer-slide 1.8s linear infinite;
}
@keyframes progress-shimmer {
  0%   { width: 28%; }
  50%  { width: 55%; }
  100% { width: 28%; }
}
@keyframes shimmer-slide {
  from { transform: translateX(-40px); }
  to   { transform: translateX(200px); }
}

/* ── Actions ── */
.actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: fade-in 0.5s 0.65s both;
}
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 10px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.2);
  color: #ffffff;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.04em;
}
.btn-back:hover {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.4);
  color: #fff;
  transform: translateX(-2px);
}
.eta-badge {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: rgba(252,220,4,0.5);
  border: 1px solid rgba(252,220,4,0.15);
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(252,220,4,0.04);
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
