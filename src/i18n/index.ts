import { createI18n } from 'vue-i18n'
import { zhCN } from './messages'

export const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: { 'zh-CN': zhCN },
  numberFormats: {
    'zh-CN': { integer: { maximumFractionDigits: 0 }, usd: { style: 'currency', currency: 'USD' } },
  },
  datetimeFormats: {
    'zh-CN': {
      short: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      },
    },
  },
})
