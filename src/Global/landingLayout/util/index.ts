import { statusMap, getSubdomainName, formatCurrency } from '@/Global'
import { dateTime, date, getLocalValues, keysToUse, addNumberCommas } from '../../Helpers'
import { Eye, Edit, Trash, X, Send } from 'lucide-vue-next'
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
  const statusMapAny = statusMap as Record<string, any>
  const filter: Record<string, () => any> = {
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
        statusMapAny?.[`${data}`] ??
        statusMapAny?.[`${data}`?.toLowerCase()] ??
        statusMapAny?.[`${data}`?.toUpperCase()] ??
        data
      return `<span class="${verifyTheStatus?.className}">${verifyTheStatus?.label}</span>`
    },
    number: () => {
      return addNumberCommas(data)
    },
    money: () => {
      return `<span>${formatCurrency(data)}</span>`
    },
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
      'flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60',
  },
  view: {
    icon: Eye,
    action: () => {
      return 'view'
    },
    class:
      'flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py- text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60',
  },
  share: {
    icon: Send,
    action: (row: any) => {
      // you can pass row data here
      return {
        type: 'share',
        // data: row
      }
    },
    class:
      'flex items-center gap-1 px-3 py-2 text-center rounded-full text-[14px] font-small text-gray-600 transition-all duration-200 leading-none whitespace-nowrap text-blue-600 bg-blue-50 hover:bg-blue-100 border-0',
  },
}

export const dataTabelFilter = (collection: any, searchQuery: any) => {
  const sliptTheString = searchQuery?.split(' ').map((stng: any) => `${stng}`.toLowerCase())
  return (collection ?? []).filter((item: any) => {
    const stng = JSON.stringify(item)
    return sliptTheString.some((query: any) => stng.toLowerCase().includes(query))
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
  const interceptor = subdomain ? tenantClient : apiClient,
    createTheState = props?.state ? props?.state : props?.url.replace(/[^a-z0-9]+/gi, '-')
  const branch_id = getLocalValues('activeBranch' as const)
  // const method = resolveMethod(props?.url, data, props?.method)
  const quer = props?.url.includes('?') ? `${props?.url}&` : `${props?.url}?`
  const branchQuery =
    branch_id && branch_id !== 'undefined' && branch_id !== 'null' ? `branch_id=${branch_id}` : ''
  const collection = {
    reload: !!props.reload ? 0 : 1, // dont think am stupid i know that
    // reload: !!props.reload ? 0 : 1, // dont think am stupid i know that
    StateStore: createTheState,
    time: props?.time ?? 0,
    reqs: {
      ...props,
      url: quer + branchQuery,
      method: 'post',
      data,
    },
    config: props?.config,
    axiosInstance: interceptor,
    mStore: { mUse: saveData ?? true },
  }
  // console.log({collection});

  return await Store.stateGenaratorApi(collection)
}

function buildUrlWithQuery(url: string, params: Record<string, any>) {
  const [path, existingQuery = ''] = `${url ?? ''}`.split('?')
  const searchParams = new URLSearchParams(existingQuery)

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'undefined') {
      return
    }

    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()

  return query ? `${path}?${query}` : path
}
