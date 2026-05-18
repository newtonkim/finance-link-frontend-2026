/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AccountInlineCreate from '../components/AccountInlineCreate.vue'

describe('AccountInlineCreate', () => {
  it('renders default ASSET label', () => {
    const wrapper = mount(AccountInlineCreate, {
      props: { accountType: 'ASSET', parentGlCode: '11300' },
    })
    expect(wrapper.text()).toContain('Create new asset account')
  })

  it('renders default INCOME label', () => {
    const wrapper = mount(AccountInlineCreate, {
      props: { accountType: 'INCOME', parentGlCode: '41100' },
    })
    expect(wrapper.text()).toContain('Create new income account')
  })

  it('honors a custom label prop', () => {
    const wrapper = mount(AccountInlineCreate, {
      props: { accountType: 'ASSET', parentGlCode: '11300', label: 'Add custom asset' },
    })
    expect(wrapper.text()).toContain('Add custom asset')
    expect(wrapper.text()).not.toContain('Create new asset account')
  })

  it('emits click with the props payload', async () => {
    const wrapper = mount(AccountInlineCreate, {
      props: { accountType: 'INCOME', parentGlCode: '42000' },
    })
    await wrapper.find('button').trigger('click')
    const events = wrapper.emitted('click')
    expect(events).toBeTruthy()
    expect(events![0]).toEqual([{ accountType: 'INCOME', parentGlCode: '42000' }])
  })
})
