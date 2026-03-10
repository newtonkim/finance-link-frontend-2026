import { h, ref, watch, render } from 'vue'
import ConfirmationDialog from './ConfirmationDialog.vue'

export function showConfirmationDialog({ items, show = true }) {
  return new Promise((resolve) => {
    const showDialog = ref(show)

    let container = document.getElementById('dialog-root')
    if (!container) {
      container = document.createElement('div')
      container.id = 'dialog-root'
      document.body.appendChild(container)
    }

    const vnode = h(ConfirmationDialog, {
      items,
      show: showDialog.value,
      'onUpdate:show': (val) => (showDialog.value = val),
      cancel: () => {
        resolve(false)
        showDialog.value = false
      },
      confirm: (member) => {
        resolve(member)
        showDialog.value = false
      }
    })

    watch(showDialog, (val) => {
      if (!val) render(null, container)
    })

    render(vnode, container)
  })
}