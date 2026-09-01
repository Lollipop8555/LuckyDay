<script setup>
import { computed } from 'vue'
import { fortuneLevel, splitPoem } from '../utils/signs'

const props = defineProps({
  sign: { type: Object, required: true },
  system: { type: String, required: true }
})

const emit = defineEmits(['close'])

const level = computed(() => fortuneLevel(props.system, props.sign.name))

// 签文行展示：一行两句，共 2 行
const lines = computed(() => {
  const s = splitPoem(props.system, props.sign.poem)
  return [s.slice(0, 2), s.slice(2, 4)]
})
</script>

<template>
  <Teleport to="body">
    <Transition name="mask-fade" appear>
      <div class="mask" @click.self="emit('close')">
        <Transition name="dlg-pop" appear>
          <div class="dialog" role="dialog" aria-modal="true">
            <button class="close" aria-label="关闭" @click="emit('close')">×</button>

            <header class="dlg-head">
              <span class="badge" :class="'lv' + level">{{ sign.name }}</span>
              <h2 class="dlg-title">第 {{ sign.number }} 签</h2>
            </header>

            <div class="poem-lines">
              <p v-for="(line, i) in lines" :key="i" class="pl">
                <template v-for="(c, j) in line" :key="j">
                  <span class="cl">{{ c }}</span>
                </template>
              </p>
            </div>

            <div class="body">
              <template v-if="system === 'zh'">
                <section class="sec">
                  <h4>解曰</h4>
                  <p>{{ sign.detail }}</p>
                </section>
                <section class="sec">
                  <h4>所求</h4>
                  <p>{{ sign.wish }}</p>
                </section>
                <section v-if="sign.caution" class="sec">
                  <h4>注意</h4>
                  <p>{{ sign.caution }}</p>
                </section>
              </template>

              <template v-else>
                <section class="sec">
                  <h4>签意</h4>
                  <p>{{ sign.colA }}</p>
                </section>
                <section class="sec">
                  <h4>详解</h4>
                  <p>{{ sign.colB }}</p>
                </section>
                <section class="sec">
                  <h4>白话解读</h4>
                  <p>{{ sign.detail }}</p>
                </section>
              </template>
            </div>

            <button class="btn btn-primary btn-full" @click="emit('close')">知道了</button>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: rgba(43, 34, 24, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  overflow-y: auto;
}

.dialog {
  position: relative;
  width: 100%;
  max-width: 560px;
  max-height: 86dvh;
  overflow-y: auto;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 24px;
  box-shadow: var(--shadow-md);
  padding: 30px 28px 26px;
  overscroll-behavior: contain;
}

.close {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--ink-3);
  font-size: 20px;
  line-height: 1;
  transition: background 0.2s ease, color 0.2s ease;
}

.close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--ink);
}

.dlg-head {
  text-align: center;
  margin-bottom: 14px;
}

.badge {
  display: inline-block;
  color: #fff;
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 4px;
  padding: 5px 16px 5px 19px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--lv-a, #d9a53b), var(--lv-b, #b8860b));
  text-indent: 2px;
}

.dlg-title {
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-2);
  margin-top: 10px;
  letter-spacing: 2px;
}

.poem-lines {
  text-align: center;
  padding: 4px 8px 18px;
  border-bottom: 1px dashed var(--line);
  margin-bottom: 18px;
}

.pl {
  display: flex;
  justify-content: center;
  font-family: var(--font-serif);
  font-size: 15px;
  line-height: 2.2;
}

.pl .cl + .cl::before {
  content: '　';
}

.pl:only-child {
  justify-content: center;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sec {
  background: rgba(246, 240, 229, 0.55);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
}

.sec h4 {
  font-family: var(--font-serif);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 4px;
  color: var(--accent);
  margin-bottom: 8px;
}

.sec p {
  font-size: 13.5px;
  line-height: 1.9;
  color: var(--ink-2);
  white-space: pre-line;
}

.dialog > .btn {
  margin-top: 20px;
}

/* 评级配色 */
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

<style>
.mask-fade-enter-active,
.mask-fade-leave-active {
  transition: opacity 0.25s ease;
}
.mask-fade-enter-from,
.mask-fade-leave-to {
  opacity: 0;
}
.dlg-pop-enter-active {
  animation: ld-pop-in 0.35s cubic-bezier(0.22, 0.9, 0.3, 1) both;
}
.dlg-pop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.dlg-pop-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
