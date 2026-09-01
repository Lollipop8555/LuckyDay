<script setup>
import { computed } from 'vue'
import { fortuneLevel, splitPoem } from '../utils/signs'

const props = defineProps({
  sign: { type: Object, default: null },
  system: { type: String, required: true },
  placeholder: { type: Boolean, default: false },
  animate: { type: Boolean, default: false } // 是否播放入场弹出动画（仅抽签占位签）
})

const level = computed(() => (props.sign ? fortuneLevel(props.system, props.sign.name) : 0))
const name = computed(() => (props.sign ? props.sign.name : '求签中'))
const noText = computed(() => (props.sign ? `第 ${props.sign.number} 签` : '· · ·'))

// 签文总共 2 列：第一、二句在同一列（空格隔开，整体高一点）；第三、四句在同一列（空格隔开，整体低一点）
const cols = computed(() => {
  if (!props.sign) return { a: '', b: '' }
  const s = splitPoem(props.system, props.sign.poem)
  return {
    a: s.slice(0, 2).join('　'),
    b: s.slice(2, 4).join('　')
  }
})
</script>

<template>
  <article class="sign-strip" :class="['lv' + level, { placeholder, pop: animate }]">
    <span class="eye"></span>
    <span class="badge">{{ name }}</span>
    <span class="no">{{ noText }}</span>

    <div v-if="sign" class="poem-cols">
      <p v-if="cols.a" class="col col-a">{{ cols.a }}</p>
      <p v-if="cols.b" class="col col-b">{{ cols.b }}</p>
    </div>
    <div v-else class="poem-cols dots">
      <p class="col">· · ·</p>
    </div>
  </article>
</template>

<style scoped>
.sign-strip {
  position: relative;
  width: 132px;
  height: 468px;
  background: linear-gradient(180deg, #fffdf8 0%, #f7f0e1 100%);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 10px 16px;
  overflow: hidden;
}

/* 入场弹出动画：仅抽签占位签播放，避免签入列时重复弹出 */
.sign-strip.pop {
  animation: ld-slip-in 0.65s cubic-bezier(0.22, 0.9, 0.3, 1) both;
}

/* 签条底部渐隐，长诗文截断更自然 */
.sign-strip::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 42px;
  background: linear-gradient(180deg, transparent, #f7f0e1);
  pointer-events: none;
}

.eye {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--lv-a, #c9a24b);
  box-shadow: 0 0 0 3px rgba(201, 162, 75, 0.18);
  margin-bottom: 12px;
}

.badge {
  color: #fff;
  font-family: var(--font-serif);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 3px;
  text-indent: 3px;
  padding: 4px 12px 4px 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--lv-a, #d9a53b), var(--lv-b, #b8860b));
}

.no {
  margin-top: 9px;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 1px;
}

/* 签文：总共 2 列并排，每列两句连成一串竖排、句间空格隔开；前列高一点，后列低一点 */
.poem-cols {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 14px;
  margin-top: 18px;
  overflow: hidden;
}

.col {
  margin: 0;
  writing-mode: vertical-rl;
  font-family: var(--font-serif);
  font-size: 12px;
  line-height: 2.05;
  letter-spacing: 6px;
  color: var(--ink);
  white-space: nowrap;
  user-select: none;
}

.col-b {
  margin-top: 40px; /* 后面一列整体低一点，区分前后 */
}

.poem-cols.dots .col {
  letter-spacing: 5px;
  color: var(--ink-3);
}

.placeholder .badge {
  background: linear-gradient(135deg, #c6c1b8, #a49d92);
}

.placeholder {
  filter: saturate(0.35);
}

/* 评级配色：5 金 / 4 红 / 3 橙 / 2 蓝灰 / 1 深灰 */
.lv5 {
  --lv-a: #e3b94f;
  --lv-b: #bd8f22;
}
.lv4 {
  --lv-a: #d97b57;
  --lv-b: #c0522f;
}
.lv3 {
  --lv-a: #d9a05f;
  --lv-b: #c0843d;
}
.lv2 {
  --lv-a: #9fb4c4;
  --lv-b: #7b92a8;
}
.lv1 {
  --lv-a: #9aa0a8;
  --lv-b: #6e747d;
}
</style>
