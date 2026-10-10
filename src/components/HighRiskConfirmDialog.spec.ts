import { i18n } from '@/i18n'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import HighRiskConfirmDialog from './HighRiskConfirmDialog.vue'

describe('HighRiskConfirmDialog', () => {
  it('requires a reason, a six-digit code, and the explicit action phrase', async () => {
    const wrapper = mount(HighRiskConfirmDialog, {
      props: {
        open: true,
        title: 'Revoke',
        objectLabel: 'SES-1',
        impact: 'Impact',
        consequence: 'Consequence',
      },
      global: { plugins: [i18n], stubs: { Teleport: true } },
    })

    const submit = wrapper.get('button[type="submit"]')
    expect(submit.attributes('disabled')).toBeDefined()

    await wrapper.get('textarea').setValue('Suspicious device activity')
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('123456')
    await inputs[1].setValue('REVOKE')
    await nextTick()
    expect((wrapper.get('button[type="submit"]').element as HTMLButtonElement).disabled).toBe(false)

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('confirm')?.[0]).toEqual([
      { reason: 'Suspicious device activity', verificationCode: '123456' },
    ])
  })
})
