<script setup lang="ts">
// Public marketing hero for the "/" route — shown to everyone, logged in or not.
// The CTAs adapt: signed-out visitors are sent to /login or /register, signed-in
// users go straight to /dashboard instead.
// Layered scene (bottom → top): parallax grid → dim "base" field → cursor-revealed
// bright field (masked via a canvas-generated radial gradient) → readability scrim →
// decorative stats arc → hero copy. All mouse-driven effects share one rAF loop.

const { t, locale, locales, setLocale } = useI18n()
const { loggedIn } = useUserSession()

const mobileLocaleList = computed(() =>
  (locales.value as Array<string | { code: string; name?: string }>).map((l) =>
    (typeof l === 'string' ? { code: l, name: l } : { code: l.code, name: l.name ?? l.code }),
  ),
)

const currentMobileLocale = computed(() => mobileLocaleList.value.find((l) => l.code === locale.value) ?? mobileLocaleList.value[0])

const mobileLangOpen = ref(false)

function selectMobileLocale(code: string) {
  setLocale(code as typeof locale.value)
  closeMobile()
}

const primaryHref = computed(() => (loggedIn.value ? '/dashboard' : '/register'))
const primaryLabel = computed(() => (loggedIn.value ? t('landing.ctaLoggedIn') : t('landing.cta')))
const connectHref = computed(() => (loggedIn.value ? '/dashboard' : '/login'))
const connectLabel = computed(() => (loggedIn.value ? t('landing.nav.dashboard') : t('landing.nav.connect')))

const mobileOpen = ref(false)
function closeMobile() {
  mobileOpen.value = false
  mobileLangOpen.value = false
}

const navLinks = computed(() => [
  { key: 'modules', label: t('landing.nav.modules') },
  { key: 'customers', label: t('landing.nav.customers') },
  { key: 'automation', label: t('landing.nav.automation') },
  { key: 'pricing', label: t('landing.nav.pricing') },
  { key: 'demo', label: t('landing.nav.liveDemo') },
  { key: 'contact', label: t('landing.nav.contact') },
])

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function selectMobileLink(id: string) {
  closeMobile()
  scrollToSection(id)
}

// --- decorative stats arc -------------------------------------------------
const CENTER = { x: -110, y: 300 }

interface ArcSpec { r: number; start: number; end: number; dot: number; value: string; label: string }

const arcSpecs = computed<ArcSpec[]>(() => [
  { r: 330, start: -92, end: 16, dot: -46, value: t('landing.stats.modules.value'), label: t('landing.stats.modules.label') },
  { r: 395, start: -56, end: 60, dot: 2, value: t('landing.stats.ai.value'), label: t('landing.stats.ai.label') },
  { r: 460, start: -14, end: 72, dot: 44, value: t('landing.stats.data.value'), label: t('landing.stats.data.label') },
])

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const arcs = computed(() => arcSpecs.value.map((spec, i) => {
  const start = polar(CENTER.x, CENTER.y, spec.r, spec.start)
  const end = polar(CENTER.x, CENTER.y, spec.r, spec.end)
  const dot = polar(CENTER.x, CENTER.y, spec.r, spec.dot)
  const len = spec.r * Math.abs(spec.end - spec.start) * (Math.PI / 180)
  const lineDelay = 0.4 + i * 0.22
  const dotDelay = lineDelay + 0.9
  const ringDelay = dotDelay + 0.3
  const numberDelay = dotDelay + 0.15
  const labelDelay = dotDelay + 0.3
  const match = spec.value.match(/^(\d+)(.*)$/)
  return {
    key: `arc-${i}`,
    d: `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${spec.r} ${spec.r} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    gradId: `arc-grad-${i}`,
    x1: start.x, y1: start.y, x2: end.x, y2: end.y,
    len,
    lineDelay, dotDelay, ringDelay, numberDelay, labelDelay,
    dotX: dot.x, dotY: dot.y,
    numX: dot.x + 16, numY: dot.y + 4,
    labelX: dot.x + 18, labelY: dot.y + 22,
    main: match ? match[1] : spec.value,
    suffix: match ? match[2] : '',
    label: spec.label,
  }
}))

// --- mouse-driven layer (grid parallax + spotlight reveal mask) ----------
const gridPatternRef = ref<SVGPatternElement | null>(null)
const maskCanvasRef = ref<HTMLCanvasElement | null>(null)
const revealLayerRef = ref<HTMLDivElement | null>(null)

let rafId = 0
let mouseX = 0
let mouseY = 0
let gx = 0
let gy = 0
let smoothX = -999
let smoothY = -999

function onMouseMove(e: MouseEvent) {
  mouseX = e.clientX
  mouseY = e.clientY
}

function resizeCanvas() {
  const canvas = maskCanvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function tick() {
  const w = window.innerWidth || 1
  const h = window.innerHeight || 1

  const targetX = (mouseX / w - 0.5) * 16
  const targetY = (mouseY / h - 0.5) * 16
  gx += (targetX - gx) * 0.06
  gy += (targetY - gy) * 0.06
  gridPatternRef.value?.setAttribute('patternTransform', `translate(${gx.toFixed(2)} ${gy.toFixed(2)})`)

  smoothX += (mouseX - smoothX) * 0.1
  smoothY += (mouseY - smoothY) * 0.1

  const canvas = maskCanvasRef.value
  const ctx = canvas?.getContext('2d')
  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const gradient = ctx.createRadialGradient(smoothX, smoothY, 0, smoothX, smoothY, 260)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.75)')
    gradient.addColorStop(0.75, 'rgba(255,255,255,0.4)')
    gradient.addColorStop(0.88, 'rgba(255,255,255,0.12)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL()
    if (revealLayerRef.value) {
      revealLayerRef.value.style.maskImage = `url(${dataUrl})`
      revealLayerRef.value.style.webkitMaskImage = `url(${dataUrl})`
    }
  }

  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('resize', resizeCanvas)
  rafId = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<template>
  <div class="min-h-screen bg-ink-950 tracking-[-0.02em]">
    <!-- Navbar -->
    <nav class="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between md:justify-center p-4 sm:p-5">
      <!-- Desktop: one centered pill -->
      <div class="nav-drop hidden md:flex items-center gap-1 bg-ink-950/60 backdrop-blur-md rounded-full pl-3 pr-2 py-2">
        <UiBrandMark :size="22" />
        <a
          v-for="link in navLinks"
          :key="link.key"
          :href="`#${link.key}`"
          class="text-sm font-medium px-3 py-1.5 rounded-full text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          @click.prevent="scrollToSection(link.key)"
        >
          {{ link.label }}
        </a>
        <NuxtLink
          :to="connectHref"
          class="bg-paper text-ink-950 text-sm font-semibold px-5 py-1.5 rounded-full hover:bg-paper-200 transition-colors ml-1"
        >
          {{ connectLabel }}
        </NuxtLink>
        <UiLocaleSwitcher class="ml-1" />
      </div>

      <!-- Mobile: logo pill + hamburger pill (hidden while the full-screen menu is open) -->
      <template v-if="!mobileOpen">
        <div class="nav-drop md:hidden flex items-center bg-ink-950/60 backdrop-blur-md rounded-full p-2">
          <UiBrandMark :size="22" />
        </div>
        <button
          class="nav-drop md:hidden flex items-center justify-center bg-ink-950/60 backdrop-blur-md rounded-full p-2 size-[38px] text-white"
          :aria-label="t('landing.menuOpen')"
          @click="mobileOpen = true"
        >
          <UiIcon name="menu" :size="22" />
        </button>
      </template>

      <div v-if="mobileOpen" class="fixed inset-0 z-[60] flex flex-col bg-ink-950 md:hidden">
        <div class="flex items-center justify-between p-4 sm:p-5">
          <div class="flex items-center bg-white/10 rounded-full p-2">
            <UiBrandMark :size="22" />
          </div>
          <button
            class="flex items-center justify-center bg-white/10 rounded-full p-2 size-[38px] text-white"
            :aria-label="t('landing.menuClose')"
            @click="closeMobile"
          >
            <UiIcon name="x" :size="22" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 pb-8 flex flex-col">
          <a
            v-for="link in navLinks"
            :key="link.key"
            :href="`#${link.key}`"
            class="py-3.5 border-b border-white/10 text-white text-lg font-medium"
            @click.prevent="selectMobileLink(link.key)"
          >
            {{ link.label }}
          </a>

          <div class="mt-6">
            <button
              type="button"
              class="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-white/15 bg-white/5"
              :aria-expanded="mobileLangOpen"
              aria-haspopup="listbox"
              @click="mobileLangOpen = !mobileLangOpen"
            >
              <span class="flex items-center gap-2.5">
                <UiFlag v-if="currentMobileLocale" :code="currentMobileLocale.code" :size="18" />
                <span class="text-sm font-medium text-white">{{ currentMobileLocale?.name }}</span>
              </span>
              <UiIcon name="chevron-down" :size="16" class="text-white/60 transition-transform" :class="{ 'rotate-180': mobileLangOpen }" />
            </button>

            <div v-if="mobileLangOpen" role="listbox" class="mt-1 rounded-lg border border-white/15 overflow-hidden">
              <button
                v-for="l in mobileLocaleList"
                :key="l.code"
                type="button"
                role="option"
                :aria-selected="l.code === locale"
                class="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors"
                :class="l.code === locale ? 'bg-white/15 text-white font-medium' : 'text-gray-300 hover:bg-white/10'"
                @click="selectMobileLocale(l.code)"
              >
                <UiFlag :code="l.code" :size="18" />
                <span>{{ l.name }}</span>
              </button>
            </div>
          </div>

          <NuxtLink
            :to="connectHref"
            class="mt-auto pt-6 block text-center bg-primary text-ink-950 text-sm font-semibold px-5 py-3 rounded-full"
            @click="closeMobile"
          >
            {{ connectLabel }}
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="relative overflow-hidden" style="height: 100dvh">
      <!-- z-0: parallax grid -->
      <svg class="absolute inset-0 w-full h-full z-0" style="opacity: 0.1" aria-hidden="true">
        <defs>
          <pattern id="landing-grid" ref="gridPatternRef" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#64748b" stroke-width="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#landing-grid)" />
      </svg>

      <!-- z-10: dim base field, Ken Burns intro -->
      <div class="hero-kenburns absolute inset-0 z-10 overflow-hidden">
        <div class="absolute inset-0" style="background: radial-gradient(circle at 30% 20%, rgba(57,255,20,0.10), transparent 60%), radial-gradient(circle at 80% 90%, rgba(57,255,20,0.06), transparent 55%), linear-gradient(160deg, #0a0a0a 0%, #050505 55%, #0a0a0a 100%)" />
        <svg class="absolute -right-[10%] bottom-[-15%] w-[85%] h-[85%] opacity-[0.14]" viewBox="0 0 256 256" aria-hidden="true">
          <path d="M 256 64 L 256 128 L 192.5 128 L 160 95 L 128 64 L 96 95 L 63.5 128 L 64 128 L 128 192 L 128 256 L 64.5 256 L 32 223 L 0 192 L 0 64 L 64 0 L 192 0 Z M 256 192 L 256 256 L 192.5 256 L 160 223 L 128 192 L 128 128 L 192 128 Z" fill="#39FF14" />
        </svg>
      </div>

      <!-- z-30: bright field, revealed under the cursor via canvas mask -->
      <div
        ref="revealLayerRef"
        class="absolute inset-0 z-30 overflow-hidden"
        style="mask-size: 100% 100%; -webkit-mask-size: 100% 100%; mask-repeat: no-repeat; -webkit-mask-repeat: no-repeat"
      >
        <div class="absolute inset-0" style="background: radial-gradient(circle at 30% 20%, rgba(57,255,20,0.45), transparent 55%), radial-gradient(circle at 75% 85%, rgba(57,255,20,0.32), transparent 50%), linear-gradient(160deg, #0f1f0a 0%, #0a0a0a 60%)" />
        <svg class="absolute -right-[10%] bottom-[-15%] w-[85%] h-[85%]" style="filter: drop-shadow(0 0 40px rgba(57,255,20,0.55))" viewBox="0 0 256 256" aria-hidden="true">
          <path d="M 256 64 L 256 128 L 192.5 128 L 160 95 L 128 64 L 96 95 L 63.5 128 L 64 128 L 128 192 L 128 256 L 64.5 256 L 32 223 L 0 192 L 0 64 L 64 0 L 192 0 Z M 256 192 L 256 256 L 192.5 256 L 160 223 L 128 192 L 128 128 L 192 128 Z" fill="#39FF14" fill-opacity="0.85" />
        </svg>
      </div>

      <!-- hidden canvas used only to generate the mask's radial gradient -->
      <canvas ref="maskCanvasRef" class="hidden" aria-hidden="true" />

      <!-- z-40: readability scrim -->
      <div class="absolute inset-0 z-40 pointer-events-none bg-gradient-to-t from-ink-950 via-ink-950/10 via-40% to-transparent to-75%" />

      <!-- z-50: decorative stats arc (desktop only) -->
      <div class="block absolute inset-y-0 right-0 z-50 pointer-events-none">
        <svg viewBox="0 0 380 700" preserveAspectRatio="xMaxYMid meet" class="h-full w-auto">
          <defs>
            <linearGradient
              v-for="arc in arcs"
              :id="arc.gradId"
              :key="arc.gradId"
              gradientUnits="userSpaceOnUse"
              :x1="arc.x1" :y1="arc.y1" :x2="arc.x2" :y2="arc.y2"
            >
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
              <stop offset="22%" stop-color="#ffffff" stop-opacity="0.5" />
              <stop offset="55%" stop-color="#ffffff" stop-opacity="0.5" />
              <stop offset="85%" stop-color="#ffffff" stop-opacity="0.1" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
            </linearGradient>
          </defs>

          <g v-for="arc in arcs" :key="arc.key">
            <path
              class="arc-line"
              :d="arc.d"
              fill="none"
              :stroke="`url(#${arc.gradId})`"
              stroke-width="1.1"
              :style="{ '--len': arc.len, animationDelay: `${arc.lineDelay}s` }"
            />
            <circle
              class="arc-dot"
              :cx="arc.dotX" :cy="arc.dotY" r="3.4" fill="#ffffff"
              :style="{ animationDelay: `${arc.dotDelay}s` }"
            />
            <circle
              class="arc-ring"
              :cx="arc.dotX" :cy="arc.dotY" r="7" fill="none" stroke="#ffffff" stroke-opacity="0.35"
              :style="{ animationDelay: `${arc.ringDelay}s` }"
            />
            <text
              class="arc-text"
              :x="arc.numX" :y="arc.numY" fill="#ffffff" font-size="32"
              :style="{ animationDelay: `${arc.numberDelay}s` }"
            >{{ arc.main }}<tspan font-size="19" dy="-10" style="letter-spacing: -1px">{{ arc.suffix }}</tspan></text>
            <text
              class="arc-text uppercase"
              :x="arc.labelX" :y="arc.labelY" fill="#ffffff" fill-opacity="0.8" font-size="8.5" font-weight="600"
              style="letter-spacing: 2px"
              :style="{ animationDelay: `${arc.labelDelay}s` }"
            >{{ arc.label }}</text>
          </g>
        </svg>
      </div>

      <!-- z-50: hero copy -->
      <div class="absolute bottom-[20vh] sm:bottom-16 md:bottom-24 left-5 sm:left-8 md:left-12 z-50 max-w-[300px] sm:max-w-md">
        <p class="hero-rise text-[11px] sm:text-xs font-semibold tracking-[0.12em] text-white/90" style="animation-delay: 0.15s">
          {{ t('landing.eyebrowPrefix') }}<span class="italic">{{ t('landing.eyebrowEmphasis') }}</span>
        </p>
        <h1 class="hero-rise text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-[-0.08em] text-white mt-3" style="animation-delay: 0.3s">
          {{ t('landing.headline1') }}<br>{{ t('landing.headline2') }}<br>{{ t('landing.headline3') }}
        </h1>
        <p class="hero-rise text-sm sm:text-base text-white/90 leading-relaxed mt-4" style="animation-delay: 0.5s">
          {{ t('landing.paragraph') }}
        </p>
        <NuxtLink
          :to="primaryHref"
          class="hero-rise group relative inline-flex overflow-hidden mt-6 px-7 sm:px-8 py-3 sm:py-3.5 rounded-full bg-primary text-ink-950 text-sm font-semibold shadow-lg shadow-black/20 transition-transform duration-200 hover:scale-[1.04] active:scale-95"
          style="animation-delay: 0.7s"
        >
          <span class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span class="relative">{{ primaryLabel }}</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
@keyframes kenBurns {
  from { transform: scale(1.12); }
  to { transform: scale(1); }
}
.hero-kenburns {
  animation: kenBurns 2.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes heroRise {
  from { opacity: 0; transform: translateY(26px); filter: blur(8px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}
.hero-rise {
  opacity: 0;
  animation: heroRise 0.95s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes navDrop {
  from { opacity: 0; transform: translateY(-18px); }
  to { opacity: 1; transform: translateY(0); }
}
.nav-drop {
  opacity: 0;
  animation: navDrop 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: 0.1s;
}

@keyframes arcDraw {
  to { stroke-dashoffset: 0; }
}
.arc-line {
  stroke-dasharray: var(--len);
  stroke-dashoffset: var(--len);
  animation: arcDraw 1.6s cubic-bezier(0.65, 0, 0.35, 1) forwards;
}

@keyframes popIn {
  0% { transform: scale(0.4); }
  60% { transform: scale(1.25); }
  100% { transform: scale(1); }
}
.arc-dot {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: popIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes pulseRing {
  0% { transform: scale(1); opacity: 0.35; }
  100% { transform: scale(1.45); opacity: 0; }
}
.arc-ring {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: pulseRing 2.8s ease-in-out infinite;
}

@keyframes arcFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.arc-text {
  opacity: 0;
  animation: arcFadeIn 0.7s forwards;
}

@media (prefers-reduced-motion: reduce) {
  .hero-kenburns {
    animation: none !important;
    transform: none !important;
  }
  .hero-rise, .nav-drop, .arc-dot, .arc-text {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
  }
  .arc-line {
    animation: none !important;
    stroke-dashoffset: 0 !important;
  }
  .arc-ring {
    animation: none !important;
    opacity: 0 !important;
  }
}
</style>
