<script setup>
import { ref, computed, nextTick } from 'vue'
import SignStrip from './components/SignStrip.vue'
import InterpretationDialog from './components/InterpretationDialog.vue'
import { SYSTEMS, getZhSigns, loadChimsSigns, shouldReroll } from './utils/signs'
import { getFingerprint, drawIndex, loadHistory, saveHistory } from './utils/storage'

const system = ref('zh')
const signsCache = { zh: getZhSigns() }
const signs = ref(signsCache.zh)
const history = ref(loadHistory('zh'))
const drawing = ref(false)
const loading = ref(false)
const slip = ref(null) // 抽签中的临时签（尚未入列的签）
const draftRound = ref(0) // 占位签条挂载轮次，每次出签自增，强制以全新实例展示
const koiTip = ref(false)
const selected = ref(null) // 点击查看解析的签
const stripsRef = ref(null)

const hasDrawn = computed(() => history.value.draws.length > 0)
const buttonText = computed(() => (hasDrawn.value ? '重抽' : '抽签'))

// 鼠标滚轮 / 触控板纵向滚动 → 水平翻动签条
function onWheel(e) {
  const el = stripsRef.value
  if (!el || el.scrollWidth <= el.clientWidth + 1) return
  e.preventDefault()
  el.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

async function switchSystem(key) {
  if (key === system.value || drawing.value || loading.value) return
  system.value = key
  history.value = loadHistory(key)
  slip.value = null
  koiTip.value = false
  selected.value = null

  if (!signsCache[key]) {
    loading.value = true
    try {
      signsCache[key] = await loadChimsSigns()
    } finally {
      loading.value = false
    }
  }
  signs.value = signsCache[key]
  await nextTick()
  scrollToRight()
}

// 抽签索引：首次确定性（设备指纹 + 当天日期），重抽随机，且不与上一次相同
function pickIndex(count, total) {
  let idx = drawIndex(getFingerprint(), count, total)
  const last = history.value.draws.at(-1)
  if (last && last.index === idx && total > 1) {
    idx = (idx + 1 + Math.floor(Math.random() * (total - 1))) % total
  }
  return idx
}

// 横向滚动到最右（最新签）
async function scrollToRight() {
  await nextTick()
  const el = stripsRef.value
  if (el) el.scrollLeft = el.scrollWidth
}

async function draw() {
  if (drawing.value || loading.value) return
  drawing.value = true
  slip.value = null
  koiTip.value = false

  // 走一次完整抽签流程（含「求签中」占位 → 出签 → 入列）
  let sign = await drawOnce()

  // 抽到的每一支签（含差签）都会保留；
  // 抽到「凶 / 下下签 / 中下签 / 下签」时，提示后自动帮用户点一次「重抽」，走完整流程，直到抽到非上述签
  while (shouldReroll(system.value, sign.name)) {
    // 先清掉占位上的旧签（回到「求签中」），避免重抽时占位残留最新那一支
    slip.value = null
    koiTip.value = true
    await delay(1300)
    koiTip.value = false

    sign = await drawOnce()
  }

  slip.value = null
  drawing.value = false
  await scrollToRight()
}

// 完整的单次抽签流程：求签中占位 → 签弹出 → 入列
async function drawOnce() {
  slip.value = null
  await delay(500) // 「求签中」占位

  const index = pickIndex(history.value.draws.length, signs.value.length)
  const sign = signs.value[index]

  draftRound.value += 1 // 占位签条以全新实例挂载，杜绝任何复用残留
  slip.value = { sign } // 占位签条展示本支
  await delay(600)

  history.value.draws.push({ index, at: Date.now() })
  saveHistory(system.value, history.value)
  await scrollToRight()

  return sign
}

function openDialog(index) {
  selected.value = { sign: signs.value[index], system: system.value }
}
</script>

<template>
  <div class="page">
    <header class="top">
      <div class="brand">幸运签</div>
      <nav class="tabs">
        <button
          v-for="s in SYSTEMS"
          :key="s.key"
          class="tab"
          :class="{ active: system === s.key }"
          :disabled="drawing || loading"
          @click="switchSystem(s.key)"
        >
          {{ s.name }}
        </button>
      </nav>
    </header>

    <main class="stage">
      <!-- 锦鲤换签提示 -->
      <Transition name="toast">
        <div v-if="koiTip" class="koi-tip">哎呀，这支不太好，锦鲤帮你重抽一支</div>
      </Transition>

      <!-- 空状态：尚未抽签 -->
      <div v-if="!hasDrawn && !drawing" class="empty">
        <div class="empty-seal">签</div>
        <p class="empty-text">静心凝神 · 诚心所求</p>
      </div>

      <!-- 签条排：单行水平排列（不换行），可横向滑动/滚轮翻动；最新签固定在右缘，其余签从它左侧叠放滑过 -->
      <div v-else class="strips-wrap">
        <div ref="stripsRef" class="strips" @wheel="onWheel">
          <div class="strips-inner">
            <button
              v-for="(d, i) in history.draws"
              :key="system + '-' + i + '-' + d.index"
              class="strip-btn"
              :class="{ latest: !drawing && i === history.draws.length - 1 }"
              @click="openDialog(d.index)"
            >
              <SignStrip :sign="signs[d.index]" :system="system" />
            </button>

            <!-- 抽签动画签条（占位，最新固定在右缘；仅此签播放入场弹出动画） -->
            <div v-if="drawing" class="strip-btn latest">
              <SignStrip
                :key="'draft-' + draftRound + '-' + (slip ? slip.sign.number : 'none')"
                :sign="slip ? slip.sign : null"
                :system="system"
                :placeholder="!slip"
                :animate="true"
              />
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="dock">
      <button
        class="btn btn-primary dock-btn"
        :disabled="drawing || loading"
        @click="draw"
      >
        {{ drawing ? '正在求签…' : loading ? '加载中…' : buttonText }}
      </button>
    </footer>

    <InterpretationDialog
      v-if="selected"
      :sign="selected.sign"
      :system="selected.system"
      @close="selected = null"
    />
  </div>
</template>

<style scoped>
.page {
  height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* ---------- 顶部 ---------- */
.top {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: calc(env(safe-area-inset-top) + 20px) 20px 16px;
  background: linear-gradient(180deg, var(--bg-1) 0%, rgba(251, 248, 242, 0) 100%);
}

.brand {
  font-family: var(--font-serif);
  font-size: 27px;
  font-weight: 700;
  letter-spacing: 10px;
  text-indent: 10px;
  color: var(--accent-deep);
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 253, 248, 0.85);
  border: 1px solid var(--line);
  border-radius: 999px;
  box-shadow: var(--shadow-sm);
}

.tab {
  padding: 8px 20px;
  border-radius: 999px;
  font-size: 14px;
  letter-spacing: 1px;
  color: var(--ink-2);
  transition: color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
}

.tab:hover:not(:disabled) {
  color: var(--ink);
}

.tab.active {
  color: #fff;
  background: linear-gradient(135deg, var(--accent), var(--accent-deep));
  box-shadow: 0 6px 14px -6px rgba(180, 85, 45, 0.5);
}

/* ---------- 舞台 ---------- */
.stage {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-seal {
  width: 78px;
  height: 78px;
  border-radius: 18px;
  border: 1.5px solid rgba(180, 85, 45, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-size: 36px;
  font-weight: 700;
  color: var(--accent);
  transform: rotate(-5deg);
  box-shadow: inset 0 0 0 5px rgba(180, 85, 45, 0.06);
  animation: ld-fade-in 0.9s ease both;
}

.empty-text {
  margin-top: 22px;
  color: var(--ink-3);
  font-size: 13px;
  letter-spacing: 5px;
  text-indent: 5px;
}

/* ---------- 签条排：单行横向滚动，宽度 = 屏幕宽度 ---------- */
.strips-wrap {
  position: relative;
  flex: 1 0 auto; /* 高度占满、禁止收缩，宽度保持 100vw */
  min-height: 0;
  width: 100vw; /* 突破 stage 的内容宽度限制，滑动区等于屏幕宽度 */
  max-width: none;
  display: flex;
  align-items: center;
}

.strips {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center; /* 未溢出时居中（旧浏览器回退） */
  justify-content: safe center; /* 溢出时回退左对齐，左侧卡片不会被裁 */
  overflow-x: auto;
  overflow-y: hidden;
  padding: 14px 0;
  scrollbar-width: none;
}

.strips::-webkit-scrollbar {
  display: none;
}

.strips-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  flex-shrink: 0;
}

/* 最新签：固定在右缘不超出屏幕，叠在其他签之上（不额外放大阴影，避免被容器截断） */
.strip-btn.latest {
  position: sticky;
  right: 0;
  z-index: 2;
  border-radius: 16px;
}

.strip-btn {
  display: block;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 16px;
  transition: transform 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.strip-btn:hover {
  transform: translateY(-5px);
}

.strip-btn:active {
  transform: scale(0.97);
}

.strip-btn.latest:hover {
  transform: none;
}

/* ---------- 锦鲤提示 ---------- */
.koi-tip {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 92px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  padding: 12px 26px;
  border-radius: 999px;
  background: rgba(255, 253, 248, 0.96);
  border: 1px solid rgba(201, 162, 75, 0.5);
  box-shadow: var(--shadow-md);
  color: var(--accent-deep);
  font-size: 14px;
  letter-spacing: 1px;
  white-space: nowrap;
}

/* ---------- 底部抽签按钮 ---------- */
.dock {
  position: relative;
  z-index: 20;
  display: flex;
  justify-content: center;
  padding: 14px 20px calc(env(safe-area-inset-bottom) + 16px);
  background: linear-gradient(180deg, rgba(251, 248, 242, 0) 0%, var(--bg-1) 45%);
}

.dock-btn {
  width: min(340px, 70vw);
}

/* ---------- 过渡动画 ---------- */
.toast-enter-active {
  animation: ld-toast-in 0.4s cubic-bezier(0.22, 0.9, 0.3, 1) both;
}

.toast-leave-active {
  transition: opacity 0.3s ease;
}

.toast-leave-to {
  opacity: 0;
}
</style>
