import { statusMap, getSubdomainName } from '@/Global'
import { dateTime, date } from '../../Helpers'
import { Eye, Edit, Trash, UserCircle2, X } from 'lucide-vue-next'
import { setUpAxiosToUse } from 'septor-store'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { apiClient } from '@/central/api/client'

function splitTheLink(link: string) {
  if (!link) return
  const url = new URL(link)
  const url2 = url.pathname.split('/')
  const name = url2.length - 1
  return { url: url.href, name: url2[name] }
}
export const dataFomater = (data: any, type: string) => {

  const filter = {
    date: () => date(data),
    dateTime: () => dateTime(data),
    link: () => {
      const dd = splitTheLink(data)
      if (!dd?.url) return
      return ` 
           <a 
  href="${dd?.url}" 
  class="w-full flex justify-between items-center hover:bg-blue-50 gap-2 rounded-lg hover:font-bold hover:text-blue-600   cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
  target="_blank"
>
  <div class="max-w-[200px] truncate px-2.5 py-1 rounded-lg   dark:bg-white/10 text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
    ${dd?.name ?? '-'}
  </div>

  <div class="flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" class="size-3.5">
      <path d="M15 3h6v6"></path>
      <path d="M10 14 21 3"></path>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    </svg>
  </div>
</a>
            `
    },
    status: () => {
      const verifyTheStatus =
        statusMap?.[`${data}`] ??
        statusMap?.[`${data}`?.toLowerCase()] ??
        statusMap?.[`${data}`?.toUpperCase()]
      return `<span class="${verifyTheStatus?.className}">${verifyTheStatus?.label}</span>`
    },
   money: () => {
  return `<span>${new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
  }).format(data)}</span>`
}
  }
  return filter?.[type]?.() ?? data
}

export const ACTION_CONFIG = {
  close: {
    icon: X,
    action: () => {
      return 'close'
    },
    class:
      'flex items-center gap-1.5 rounded-full bg-red-500 px-3 py- text-xs font-bold text-white transition-colors hover:bg-red-100 dark:bg-blue-900/40 dark:text-red-300 dark:hover:bg-red-900/60',
  },
  edit: {
    icon: Edit,
    action: () => {
      return 'edit'
    },
    class:
      'flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py- text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60',
  },
  delete: {
    icon: Trash,

    class:
      'flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60',
  },
  view: {
    icon: Eye,
    action: () => {
      return 'view'
    },
    class:
      'flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py- text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60',
  },
}

export const dataTabelFilter = (collection: any, searchQuery: any) => {
  // const collection = Store[props?.state]?.payload ?? props.data ?? { data: [] }
  return (collection ?? []).filter((item: any) => {
    const stng = JSON.stringify(item)
    return `${stng}`.toLowerCase().includes(searchQuery.toLowerCase())
  })
}
export async function fetchTableData({
  data,
  props,
  Store,
  saveData,
}: {
  data: any
  props: any
  Store: any
  saveData?: boolean
}) { 
  const subdomain = getSubdomainName()
  const interceptor = subdomain ? tenantClient : apiClient
  const collection = {
    reload: !!props.reload ? 0 : 1, // dont think am stupid i know that
    StateStore: props?.state,
    time: props?.time ?? 0,
    reqs: {
      ...props,
      url: props?.url,
      method: 'post',
      data,
    },
    axiosInstance: interceptor,
    mStore: { mUse: saveData ?? true },
  }
  return await Store.stateGenaratorApi(collection)
}
