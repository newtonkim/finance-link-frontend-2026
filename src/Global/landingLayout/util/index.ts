import { statusMap, getSubdomainName, formatCurrency } from '@/Global'
import { dateTime, date, getLocalValues, keysToUse, addNumberCommas } from '../../Helpers'
import { Eye, Edit, Trash, X, Send, ArchiveRestore,ArchiveX,Archive, RefreshCw } from 'lucide-vue-next'
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
      let verifyTheStatus =
        statusMapAny?.[`${data}`] ??
        statusMapAny?.[`${data}`?.toLowerCase()] ??
        statusMapAny?.[`${data}`?.toUpperCase()] ??
        data
      verifyTheStatus = !verifyTheStatus?.label ? { label: '-' } : verifyTheStatus
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
  archive: {
    icon: Archive,
    class:
      'flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60',
       action: () => {
      return 'unarchive'
    },
  },
 
 dormant: {
  icon: ArchiveX,
  action: () => {
    return 'dormant'
  },
  class:
    'flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-0.5 text-xs font-semibold text-red-600 shadow-sm transition-all duration-200 hover:bg-red-100 hover:border-red-300 hover:shadow dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50',
},
activate: {
  icon: ArchiveRestore,
  action: () => {
    return 'activate'
  },
  class:
    'flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-600 shadow-sm transition-all duration-200 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50',
},
  view: {
    icon: Eye,
    action: () => {
      return 'view'
    },
    class:
      'flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py- text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60',
  },
  renew: {
    icon: RefreshCw,
    action: () => {
      return 'renew'
    },
    class:
      'flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60',
  },
  unarchive: {
    icon: ArchiveX,
    action: () => {
      return 'unarchive'
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

export const dataTabelFilter = (collection: any, searchQuery: any, deepSearch: boolean) => {
  // console.log(deepSearch,collection);

  const sliptTheString = searchQuery?.split(' ').map((stng: any) => `${stng}`.toLowerCase())
  if (Array.isArray(collection)) {
    const list = (collection ?? []).filter((item: any) => {
      if (deepSearch) {
        // lets not filete into the data existing data let pick dirent

        return true
      }
      const stng = JSON.stringify(item)
      return sliptTheString.some((query: any) => stng.toLowerCase().includes(query))
    })
    // if(deepSearch) return list
    // console.log(list,searchQuery,collection);
    return list
  }
  return []
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
    StateStore: createTheState,
    time: props?.time ?? 0,
    reqs: {
      ...props,
      url: quer + branchQuery,
      method: props?.method ?? 'post',
      data,
    },
    config: props?.config,
    axiosInstance: interceptor,
    mStore: { mUse: saveData ?? true },
  }
  
  const res= await Store.stateGenaratorApi(collection)
 return res
}

function buildUrlWithQuery(url: string) {
  const parsedUrl = new URL(url)

  const params = new URLSearchParams(parsedUrl.search)

  const uniqueParams = new URLSearchParams()

  for (const [key, value] of params.entries()) {
    if (!uniqueParams.has(key)) {
      uniqueParams.append(key, value)
    }
  }
  parsedUrl.search = uniqueParams.toString()

  console.log(parsedUrl.toString())
}
