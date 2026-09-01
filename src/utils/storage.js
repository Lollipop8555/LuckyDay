const FP_KEY = 'luckyday_fingerprint'
const HIST_KEY = 'luckyday_history_v1'

// 设备指纹：浏览器本地随机 ID，作为抽签加权种子的一部分（替代 IP）
export function getFingerprint() {
  let fp = localStorage.getItem(FP_KEY)
  if (!fp) {
    fp =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    try {
      localStorage.setItem(FP_KEY, fp)
    } catch (e) {
      /* 隐私模式下忽略 */
    }
  }
  return fp
}

// 本地时区的当天日期 YYYY-MM-DD
export function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// 字符串散列（djb2 风格）
export function hashStr(s) {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0
  }
  return h >>> 0
}

// 抽签索引：首次（count === 0）用「设备指纹 + 当天日期」确定性计算；重抽 / 自动换签随机
export function drawIndex(fingerprint, count, total) {
  if (count === 0) {
    return hashStr(`${fingerprint}|${todayStr()}`) % total
  }
  return Math.floor(Math.random() * total)
}

// 读取当天历史：过期（非当天）自动清空
export function loadHistory(system) {
  const key = `${HIST_KEY}:${system}`
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const data = JSON.parse(raw)
      if (data && data.date === todayStr()) {
        return { date: data.date, draws: Array.isArray(data.draws) ? data.draws : [] }
      }
    }
  } catch (e) {
    /* 忽略损坏数据 */
  }
  return { date: todayStr(), draws: [] }
}

export function saveHistory(system, history) {
  try {
    localStorage.setItem(`${HIST_KEY}:${system}`, JSON.stringify(history))
  } catch (e) {
    /* 忽略 */
  }
}
