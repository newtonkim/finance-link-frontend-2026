import { h, ref, watch, render } from 'vue'
import ConfirmationDialog from './ConfirmationDialog.vue'

export function Confirm({ items, show = true, confirm, cancel, type,title ,des}: {
  items?: any[],
  show?: boolean,
  confirm: (item: any) => void,
  cancel?: () => void,
  type?: string
  title?: string
  des?: string
}) {
  const showDialog = ref(show)

  // Ensure container exists
  let container = document.getElementById('dialog-root')
  if (!container) {
    container = document.createElement('div')
    container.id = 'dialog-root'
    document.body.appendChild(container)
  }

  const vnode = h(ConfirmationDialog, {
    items,
    type,
    title,
    des,
    show: showDialog.value,
    'onUpdate:show': (val: boolean) => showDialog.value = val,
    onConfirm: (item: any) => {
      confirm(item)
      showDialog.value = false
    },
    onCancel: () => {
      if (cancel) cancel()
      showDialog.value = false
    }
  })

  // Watch for dialog close to clean up
  watch(showDialog, (val) => {
    if (!val) {
      render(null, container)
    }
  })

  // Render dialog
  render(vnode, container)
  showDialog.value = true
}