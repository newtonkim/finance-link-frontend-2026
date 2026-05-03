/* eslint-disable @typescript-eslint/no-explicit-any */
// import Swal from "sweetalert2";
import { EncryptStorage } from 'encrypt-storage'
// import { apiClient, apiClient as customAxios } from '@/central/api/client'
const encryptStorage = new EncryptStorage(import.meta.env.VITE_ENCRYPT_STORAGE)
import { notify } from '@/Global/Toasters'
// import * as XLSX from 'xlsx'
import { fetchTableData } from './landingLayout/util'
import { type PrintOptions } from './printing'

export * from './numericHelpers'

export const keysToUse: Record<string, any> = {
  systemSettings: 'systemSettings',
  userPermissions: 'userPermissions',
  loginUserData: 'loginUserData',
  loggedInAsStudentOrStaff: 'loggedInAsStudentOrStaff',
  IpEverLoged: 'IpEverLoged',
  activeBranch: 'activeBranch',
  memberProfile: 'memberProfile',
  SystemBranding: 'SystemBranding' + getSubdomainName(),
}
export function dateTime(time: string) {
  return tryCatch(() => {
    if (`${time}`.trim()?.length < 9) return ''
    const date = new Date(time)
    if (isNaN(date.getTime())) return ''
    const formatted = date.toISOString().replace('T', ' ').substring(0, 19)
    return formatted
  })
}
export function date(time: string) {
  return tryCatch(() => {
    if (`${time}`.trim()?.length < 9) return ''

    const date = new Date(time)
    if (isNaN(date.getTime())) return ''
    const formatted = date.toISOString().split('T')[0]
    return formatted
  })
}

// ============================================================

/***
 * ****/
export function tryCatch(callback: () => any) {
  try {
    return callback()
  } catch (error) {
    console.error(error)
    return null
  }
}
export function formatDateUs(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
export function daysLeft(expiresAt?: string): number | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function storeUserLogedinData(data: any, key: string = 'loginUserData') {
  try {
    encryptStorage.setItem(keysToUse[key as keyof typeof keysToUse], data)
  } catch (error) {
    console.error(`Failed to store key "${keysToUse[key as keyof typeof keysToUse]}":`, error)
    return false
  }
}
export function setIpEverLoged(data: any): void {
  try {
    encryptStorage.setItem(keysToUse['IpEverLoged'], data)
  } catch (error) {
    console.error(`Failed to store key "${keysToUse['IpEverLoged']}":`, error)
  }
}
export function setLocalValues(key: any, data: unknown): void {
  try {
    encryptStorage.setItem(keysToUse[key], data)
  } catch (error) {
    console.error(`Failed to store key "${keysToUse['IpEverLoged']}":`, error)
  }
}
export function getLocalValues(key: any) {
  try {
    return encryptStorage.getItem(keysToUse[key])
  } catch (error) {
    console.error(`Failed to store key "${keysToUse['IpEverLoged']}":`, error)
  }
}
export function getIpEverLoged() {
  try {
    return encryptStorage.getItem(keysToUse['IpEverLoged'])
  } catch (error) {
    console.error(`Failed to store key "${keysToUse['IpEverLoged']}":`, error)
    return false
  }
}

export function removeKey(key: string) {
  try {
    encryptStorage.removeItem(keysToUse[key as keyof typeof keysToUse])
    return true
  } catch (error) {
    console.error(`Failed to remove key "${keysToUse}":`, error)
    return false
  }
}
export function logoutUser(navigate: any) {
  try {
    removeKey('userPermissions')
    removeKey('loginUserData')
    removeKey('memberProfile')
    navigate('/login')
  } catch (error) {
    console.error('Error during logout:', error)
  }
}

export function getUserData() {
  try {
    const data = encryptStorage.getItem(keysToUse['loginUserData'])
    return data || {}
  } catch (error) {
    console.error('Error retrieving user data:', error)
    return {}
  }
}

export function getUserToken() {
  try {
    const userData = getUserData()

    return userData?.token ?? null
  } catch (error) {
    console.error(error, '009')
  }
}

export function logoutUserTokenExpireTime(navigate: any) {
  const timestamp = getUserTokenExpireTime()
  const currentTime = Date.now()
  if (currentTime >= timestamp) {
    logoutUser(navigate)
  }
}

export function getUserTokenExpireTime() {
  const userData = getUserData()
  return userData?.expiresIn ?? null
}

export function storeUserCretiria(data = null) {
  try {
    encryptStorage.setItem('userCreatiria', JSON.stringify(data))
  } catch (error) {
    console.error('Error storing user permissions:', error)
  }
}
export function getSystemSetting() {
  try {
    return encryptStorage.getItem(keysToUse.systemSettings)
  } catch (error) {
    console.error('Error storing user permissions:', error)
  }
}
export function setSystemBranding(data = null) {
  try {
    return encryptStorage.setItem(keysToUse.SystemBranding, data)
  } catch (error) {
    console.error('Error storing systemBranding', error)
  }
}
export function getetSystemBranding() {
  try {
    return encryptStorage.getItem(keysToUse.SystemBranding)
  } catch (error) {
    console.error('Error storing systemBranding', error)
  }
}

export function pickAsettingKeyValue(key: string) {
  try {
    const data = encryptStorage.getItem(keysToUse.systemSettings)
    // console.log(data);

    return data[key]
  } catch (error) {
    console.error('failed to get this  key:', error)
  }
}
export function storeUserPermissions(props: { data: any } = { data: null }) {
  const { data } = props
  try {
    encryptStorage.setItem(keysToUse.userPermissions, JSON.stringify(data))
  } catch (error) {
    console.error('Error storing user permissions:', error)
  }
}
export function hasPermission(permission: string) {
  try {
    if (!`${permission}`.trim()?.length) {
      return true /// means its a global permission to be accessed
    }
    const list = localStoragePicker(keysToUse.userPermissions)
    const userPermissions = Array.isArray(list) ? list : JSON.parse(list || '[]')
    return !userPermissions.includes(permission)
  } catch (error) {
    console.error('Error :', error)
  }
}
export function appendOnAjsonStore(props: { data: any; key: any } = { data: {}, key: '' }) {
  const { data, key } = props

  try {
    const prevDta = encryptStorage.getItem(key)
    const collection = isJSON(prevDta)
    const newDateSet = { ...collection, ...data }
    encryptStorage.setItem(key, JSON.stringify(newDateSet))
  } catch (error) {
    console.error('Error storing user ' + key + ':', error)
  }
}
export function localStoragePicker(key = '') {
  try {
    const data = encryptStorage.getItem(key)
    return data || []
  } catch (error) {
    console.error('Error fetching from storage:', error)
    return []
  }
}
/////////
export function addNumberCommas(number: any, delimeter = ',') {
  return `${number}`.toString().replace(/\B(?=(\d{3})+(?!\d))/g, delimeter)
}
export const formatCurrency = (amount: number | string, currencyCode = 'UGX') => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))
}
export  const formatCurrency2 = (event: Event) => {
    const input = event.target as HTMLInputElement;

    // Keep only digits and one decimal point
    let rawVal = input.value.replace(/[^\d.]/g, '');
    const parts = rawVal.split('.');
    if (parts.length > 2) {
        rawVal = parts[0] + '.' + parts.slice(1).join('');
    }

    // Cursor position
    const cursorPosition = input.selectionStart || 0;

    // Split integer & decimal
    const [intPart, decPart] = rawVal.split('.');

    // Format integer part safely
    const formattedInt = intPart
        ? Number(intPart).toLocaleString()
        : '';

    const formatted = decPart !== undefined
        ? `${formattedInt}.${decPart}`
        : formattedInt;


    // Restore cursor (basic adjustment)
    setTimeout(() => {
        const newPos = Math.min(formatted.length, cursorPosition + (formatted.length - rawVal.length));
        input.setSelectionRange(newPos, newPos);
    });

    // Emit clean numeric value (no commas)
return rawVal
};
export const formatMoneyValue = (amount: number | string, minimumFractionDigits = 2) => {
  return new Intl.NumberFormat('en-UG', {
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(Number(amount || 0))
}
export function addMinutesToTime(startTime: string, minutesToAdd: number | string = 40) {
  const [hours = 0, minutes = 0] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + parseFloat(String(minutesToAdd))
  const endHours = Math.floor(totalMinutes / 60) % 24 // keep within 24h
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

/**
 * @param url
 *
 * @param data: object to be sent as body in post request
 * @param Action: "download" to download the file, "view" to open in new tab
 * @param type: file extension without dot, e.g., "pdf", "docx", "xlsx", "csv", "txt", "png", "jpg", etc.
 * **/
export async function downloadFile(data: {
  Store: any
  url?: string
  customUrl?: string
  data: any
  Action: 'download' | 'view'
  type: string
  name?: null | string
}) {
  const { Store, url, data: requestData, Action, type, name } = data
  const appName = import.meta.env.VITE_APP_NAME // Example of accessing environment variable

  const valueres = await fetchTableData({
    data: requestData,
    props: {
      reload: false, // dont refectch data
      state: url + '_' + 'download-export',
      url: createUrl(url, 'download-export'),
      config: { responseType: 'blob' },
    },
    Store,
  })
  const fileType: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xslx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    csv: 'text/csv',
    txt: 'text/plain',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
  }
  const filename = `${name ?? appName}-${Date.now()}.` + type
  const blob = new Blob([valueres.data ?? valueres], {
    type: fileType[type] || 'application/octet-stream',
  })
  const blobUrl = window.URL.createObjectURL(blob)

  if (Action === 'download') downloadPDF(blobUrl, filename)
  else {
    downloadPDF(url, filename)
    return blobUrl
  }
}

export function viewPDF(url: any) {
  const iframe = document.createElement('iframe')
  iframe.src = url
  iframe.style.width = '100%'
  iframe.style.height = '600px'
  document.body.appendChild(iframe)
}
export function downloadPDF(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename) // Set the file name
  document.body.appendChild(link)
  link.click() // Trigger the download
  document.body.removeChild(link) // Clean up
  window.URL.revokeObjectURL(url)
}
export function NameInitials(strings: string) {
  if (!strings || typeof strings !== 'string') return ''
  const parts = strings.trim().split(/\s+/) // handles multiple spaces
  if (parts.length === 0) return ''
  const firstInitial = parts[0]?.[0]?.toUpperCase() || ''
  const lastInitial = parts[parts.length - 1]?.[0]?.toUpperCase() || ''
  return firstInitial + lastInitial
}

export function scopeValues(data: any) {
  return tryCatch(() => {
    const values: any = {}
    data.forEach((vl: any) => {
      const value = vl?.value ?? null

      if (value instanceof File) {
        values[vl.name] = value
      } else {
        values[vl.name] = value
      }
    })

    return values
  })
}

export function isJSON(jsonString: string) {
  try {
    return JSON.parse(jsonString)
  } catch {
    // ignore
  }
  return jsonString
}
export function formDataFormatV2(fields: any[]) {
  const fd = new FormData()

  fields.forEach((field) => {
    const key = `${field.name}`.toLocaleLowerCase().replace('+S', '_')
    const value = field.value
    if (value === undefined) return

    if (value instanceof File) {
      fd.append(key, value)
      return
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('id' in value) {
        fd.append(key, value.id)
      } else {
        fd.append(key, JSON.stringify(value))
      }
      return
    }

    if (value !== null) {
      fd.append(key, value)
    }
  })
  const branch_id = getLocalValues('activeBranch')
  if (branch_id && branch_id !== 'undefined' && branch_id !== 'null') {
    fd.append('branch_id', branch_id)
  }

  return fd
}

export function formDataFormat(data: any) {
  // first version
  const formData = new FormData()

  for (const key in data) {
    const value = data[key]

    if (value === null || value === undefined || value === 'null' || value === 'undefined' || value === '') {
      continue
    }

    if (Array.isArray(value)) {
      // Handle arrays
      value.forEach((element, index) => {
        const lowerCaseKeys = `${key}[${index}]`.toLocaleLowerCase().replace('+S', '_')
        if (element && typeof element === 'object' && element.file instanceof File) {
          formData.append(lowerCaseKeys, element.file) // Use index for clarity
        } else if (
          element &&
          typeof element === 'object' &&
          element?.lastModified &&
          element?.name &&
          element?.lastModifiedDate &&
          element?.type
        ) {
          formData.append(lowerCaseKeys, element) // Use index for clarity
        } else {
          formData.append(lowerCaseKeys, JSON.stringify(element))
        }
      })
    } else if (typeof value === 'object' && !(value instanceof File)) {
      const lowerCaseKeys = `${key}`.toLocaleLowerCase().replace('+S', '_')
      formData.append(`${lowerCaseKeys}`.toLocaleLowerCase(), JSON.stringify(value))
    } else {
      const lowerCaseKeys = `${key}`.toLocaleLowerCase().replace('+S', '_')
      
      // Convert booleans to something FormData handles well (strings "true"/"false")
      if (typeof value === 'boolean') {
        formData.append(lowerCaseKeys, value ? 'true' : 'false')
      } else {
        formData.append(lowerCaseKeys, value)
      }
    }
  }
  const branch_id = getLocalValues('activeBranch')
  if (branch_id && branch_id !== 'undefined' && branch_id !== 'null') {
    formData.append('branch_id', branch_id)
  }

  return formData
}

export function companyHeader() {
  const branding = getetSystemBranding()

  const saccoName = branding?.sacco_name || 'Your Company Name'
  const saccoTagline = branding?.tagline || ''
  const logo = branding?.logo || null

  const generatedDate = new Date().toLocaleString()

  return `
    <table style="width:100%; border-bottom:1px solid #ddd; padding-bottom:15px; margin-bottom:20px; font-family: Arial, sans-serif;">
      <tr>

        <!-- Logo -->
        <td style="width:120px; vertical-align:middle;">
          ${
            logo
              ? `<img src="${logo}" style="max-height:80px; max-width:120px; object-fit:contain;" />`
              : `
              <div style="
                width:120px;
                height:80px;
                display:flex;
                align-items:center;
                justify-content:center;
                border:1px dashed #d1d5db;
                background:#f3f4f6;
                border-radius:6px;
                font-size:12px;
                color:#9ca3af;
                font-weight:bold;
              ">
                ${saccoName.substring(0, 2).toUpperCase()}
              </div>`
          }
        </td>

        <!-- Spacer -->
        <td style="width:10px;"></td>

        <!-- Company Details -->
        <td style="text-align:right; vertical-align:middle;">
          <div style="font-size:20px; font-weight:bold; color:#111827;">
            ${saccoName}
          </div>

          ${
            saccoTagline
              ? `<div style="font-size:12px; color:#6b7280; margin-top:4px; font-style:italic;">
                  ${saccoTagline}
                 </div>`
              : ''
          }

          <div style="font-size:11px; color:#9ca3af; margin-top:6px;">
            Generated on: ${generatedDate}
          </div>
        </td>

      </tr>
    </table>
  `
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function printElementId(IdElement = '', options?: PrintOptions) {
  const cached = getetSystemBranding()

  const getPrintElement = document.getElementById(IdElement)
  // console.log(cached)

  if (!getPrintElement) return

  const newWindow = window.open('', 'Print-Window')
  if (!newWindow) return

  const clonedElement = getPrintElement.cloneNode(true) as HTMLElement

  const noPrintEls = clonedElement.querySelectorAll('.no-print')
  noPrintEls.forEach((el) => el.remove())

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('')

  newWindow.document.open()
  newWindow.document.write(`
        <html>
            <head>
                <title>Print</title>
                ${styles}
                <style>
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                            width: 100%;
                        }
                    }

                    @page {
                        size: auto;
                        margin: 10mm;
                    }
                </style>
            </head>
            <body>
            ${companyHeader()}
                ${clonedElement.outerHTML}
            </body>
        </html>
    `)

  newWindow.document.close()
  newWindow.focus()

  setTimeout(() => {
    newWindow.print()
    newWindow.close()
  }, 500)
}
export type UseInitialsReturn = {
  getInitials: (fullName?: string) => string
}

export function getInitials(fullName?: string): string {
  if (!fullName) return ''

  const names = fullName.trim().split(/\s+/).filter(Boolean)

  if (names.length === 0) return ''
  if (names.length === 1) return names[0]?.charAt(0).toUpperCase() ?? ''

  const first = names[0]?.charAt(0) ?? ''
  const last = names[names.length - 1]?.charAt(0) ?? ''
  return `${first}${last}`.toUpperCase()
}

export function useInitials(): UseInitialsReturn {
  return { getInitials }
}

export function getTenantSubdomain(): string | null {
  const hostname = window.location.hostname

  // Ignore raw IP addresses
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null

  // Extract the central domain from env (strips http:// if present)
  // staging: "staging.mfukoplus.com"
  // production: "mfukoplus.com"
  const centralDomain = (import.meta.env.VITE_BASE_URL as string)
    ?.replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .split(':')[0] // Strip port if present
    .toLowerCase()

  // Fallback for local development on localhost
  if (!centralDomain && hostname.endsWith('.localhost')) {
    return hostname.split('.')[0]
  }

  // If hostname exactly matches central domain → not a tenant
  if (!centralDomain || hostname === centralDomain) return null

  // If hostname ends with .{centralDomain} → extract the subdomain prefix
  // e.g. "abc.staging.mfukoplus.com" or "abc.mfukoplus.com"
  if (hostname.endsWith(`.${centralDomain}`)) {
    const subdomain = hostname.slice(0, -(centralDomain.length + 1))
    if (!subdomain || ['admin', 'www', 'localhost', 'api', 'central'].includes(subdomain)) return null
    return subdomain
  }

  // Hostname doesn't match central domain at all — fail safe
  return null
}

export function getSubdomainName() {
  const subdomain =
    getTenantSubdomain() ??
    localStorage.getItem('tenant_subdomain') ??
    (import.meta.env.VITE_TENANT_SUBDOMAIN as string | undefined) ??
    null
  return subdomain
}

export function RouteStructure(route: any, routePath: string | null) {
  return {
    name: routePath ? `${routePath}`.replace(/\//g, '-') : '',
    path: routePath ? `/${routePath}` : '',
    component: route.component,
    meta: {
      label: route.label,
      permissions: route.permissions,
    },
  }
}
export function checkIfObjectPlain(collection: any) {
  const value = isJSON(collection)
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return true
  }
}
export function routebuilder(routes: any[] = [], prifix = 'central') {
  const collecction: any = []
  routes.forEach((route) => {
    if (!route?.children) {
      const routePath = route.path ? `${prifix}/${route.path}` : null
      //  if(hasPermission(route?.permissions))
      collecction.push(RouteStructure(route, routePath))
    } else if (Array.isArray(route.children)) {
      route.children.forEach((child: any) => {
        if (child?.items) {
          child.items.forEach((item: any) => {
            // const childRoutePath = `${prifix}/${item.path}`
            const childRoutePath = item.path ? `${prifix}/${item.path}` : null
            // if (hasPermission(route?.permissions))
            collecction.push(RouteStructure(item, childRoutePath))
          })
        }
      })
    }
  })
  return collecction
}

export function feedback(res: any, success?: string, fail?: string) {
  let successStatus = false
  let msg: Record<string, any> = {
    msg: res?.error || success,
    type: 'Error',
    success: successStatus,
  }

  if (res?.error) {
    if (res?.error.response?.data?.error) {
      msg.msg = res?.error.response.data.error
    } else if (res?.error.message) {
      msg.msg = res?.error.message
    } else if (res?.error.response?.data?.errors) {
      const errors = res?.error.response.data.errors as Record<string, any>
      msg.msg = Object.values(errors)[0][0] || msg.msg
    }
    if (res?.error?.response?.data?.payload?.message) {
      msg.msg = res?.error.response.data.payload.message
    }
  }

  if (res?.error?.message?.includes('403') || res?.error?.message?.includes('401')) {
    msg = {
      msg: 'You are not authorized to perform this action',
      type: 'error',
      success: false,
    }
  }
  if (msg.msg == 'Request failed with status code 500') {
    msg.msg = 'Something is wrong on there server side /please contact help desk to fix this issue'
  }

  if (res?.code == 200) {
    // if (!res || res.code == 200) {
    successStatus = true
    msg = {
      msg: fail,
      type: 'Success',
      success: successStatus,
    }
  }
  if (!res) msg.msg = 'Something went wrong'

  notify(msg)
  return {
    success: successStatus,
    msg,
    res,
  }
}

export function createUrl(url: string, ...actions: string[]) {
  const url2 = url.split('/')
  url2.length = url2.length - 1
  return url2.join('/') + `/${actions.join('/')}`
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    notify({ pos: 'br', type: 'info', msg: 'Copied!' })
  } catch (err) {
    notify({ pos: 'br', type: 'warning', msg: 'failed to copy' })
    console.error('Failed to copy:', err)
  }
}

export function exptendAformField({ fields, nextto, field }: any) {
  const existsIndex = fields.value.findIndex((f: any) => f.name === nextto)
  if (existsIndex === 1) {
    fields.value.splice(existsIndex + 1, 0, { ...field })
  } else {
    fields.value.splice(existsIndex + 1, 1)
  }

  return fields
}

const formatFileName = (name: string) => {
  return name
    .toLowerCase()
    .replace(/\//g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^\w-]/g, '')
}

/**
 * ie,you give headers we ignore the data 
 * 1. Export Full Data
 * exportToExcel({
    data: selected.value,
    name: 'Users List'
})
 * 
 * 
 * 2. Export Only Headers (Template File)
 * exportToExcel({
    headers: ['name', 'email', 'phone number'],
    name: 'User Template'
})
 **/
export const exportToExcel = async ({
  data = [] as any[],
  headers = [] as any[],
  name = 'export',
  sheetName = 'Sheet1',
}) => {
  const XLSX = await import('xlsx')
  if (!data.length && !headers.length) {
    console.warn('No data or headers provided')

    notify({ msg: 'No data or headers provided', type: 'error' })
    return
  }

  const date = new Date().toISOString().slice(0, 10)
  const fileName = `${formatFileName(name)}_${date}.xlsx`

  const workbook = XLSX.utils.book_new()
  let worksheet

  // Case 1: Only headers (template)
  if (headers.length) {
    const formattedHeaders = headers.map((h) =>
      h
        .toUpperCase()
        .replace(/\//g, '_')
        .replace(/\s+/g, '_')
        .replace(/[^\w-]/g, ''),
    )

    worksheet = XLSX.utils.aoa_to_sheet([formattedHeaders])
  }
  // Case 2: Full data export
  else {
    worksheet = XLSX.utils.json_to_sheet(data)

    // Auto column width
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row) => row[key]?.toString().length || 10)),
    }))

    worksheet['!cols'] = colWidths
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, fileName)
  notify({ msg: 'template downloaded successfuly \n ', type: 'info' })
}

// export const downloadFile = async (response,name='', type = "pdf") => {
//   try {
//     const url = window.URL.createObjectURL(new Blob([response.data]));

//     const link = document.createElement("a");
//     link.href = url;
//     link.setAttribute("download", `${name}-${Date.now()}.${type}`); // Set the file name
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//   } catch (error) {
//     console.error("Download failed:", error);
//   }
// };
