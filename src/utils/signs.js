import zhRaw from '../../data/data.zh.json'

export const SYSTEMS = [
  { key: 'zh', name: '浅草寺观音签' },
  { key: 'mazu', name: '妈祖灵签' },
  { key: 'chims', name: '诸葛神算' }
]

// 浅草寺观音一百签：qcs[0] 为标题，qcs[1..100] 为 [评级, 签诗, 逐句解析, 愿望, 注意]
const zhSigns = zhRaw.qcs.slice(1).map((item, i) => ({
  number: i + 1,
  name: item[0],
  poem: item[1],
  detail: item[2],
  wish: item[3],
  caution: item[4],
  colA: item[2], // 左列：逐句解析
  colB: item[3] // 右列：所求事项
}))

// 诸葛神算三百八十四签：数据较大，动态加载（点击切换到该系统时才请求）
export async function loadChimsSigns() {
  const mod = await import('../../data/chims.chs.json')
  return mod.default.map((item) => ({
    number: item.number,
    name: item.fortune,
    poem: item.poem,
    detail: item.interpretation,
    wish: item.intpn_1,
    caution: item.intpn_2,
    colA: item.intpn_1, // 左列：签意概述
    colB: item.intpn_2, // 右列：文言详解
    trigram: item.trigram
  }))
}

// 妈祖灵签六十甲子签：数据约 100KB，动态加载（点击切换到该系统时才请求）
// 妈祖签无吉凶评级，签徽直接展示干支；allusion 典故 / detail 白话解签 / omen 各事预兆
export async function loadMazuSigns() {
  const mod = await import('../../data/mazu.json')
  return mod.default.map((item) => ({
    number: item.number,
    ganzhi: item.ganzhi,
    name: item.ganzhi,
    poem: item.poem,
    allusion: item.allusion,
    detail: item.explain,
    omen: item.omen
  }))
}

export function getZhSigns() {
  return zhSigns
}

// 评级等级映射（用于徽章配色），数字越大越吉
const LEVEL_MAP = {
  zh: {
    大吉: 5,
    吉: 4,
    半吉: 3,
    小吉: 3,
    末吉: 2,
    末小吉: 2,
    凶: 1
  },
  chims: {
    上上签: 5,
    上签: 4,
    中上签: 3,
    中签: 3,
    中下签: 2,
    下签: 2,
    下下签: 1
  }
}

export function fortuneLevel(system, name) {
  const map = LEVEL_MAP[system] || {}
  return map[name] ?? 3
}

// 是否需要自动换签（抽到「凶」「下下签」「中下签」「下签」自动重抽）
export function shouldReroll(system, name) {
  if (system === 'zh') return name === '凶'
  return name === '下下签' || name === '中下签' || name === '下签'
}

// 拆分签文：浅草寺观音签按换行拆分；诸葛神算按逗号、句号等标点拆分
export function splitPoem(system, poem) {
  const raw = system === 'zh'
    ? poem.split('\n')
    : poem.split(/[，,。；;！？!?]/)
  return raw.map((s) => s.trim()).filter(Boolean)
}
