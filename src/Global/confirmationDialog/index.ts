import { h, ref, watch, render } from 'vue'
import ConfirmationDialog from './ConfirmationDialog.vue'

export function Confirm({ items, show = true ,confirm, cancel}) {
      const dialogRef = ref(null)
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
      onCancel: () => {
        showDialog.value = false
      },
      onConfirm: (member) => {
        confirm(member)
        showDialog.value = false
      }
    })

    watch(showDialog, (val) => {
      if (!val) render(null, container)
    })

    render(vnode, container)
}