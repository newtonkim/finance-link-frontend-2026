// import Swal from "sweetalert2";
import { EncryptStorage } from 'encrypt-storage'
import { apiClient as customAxios } from '@/central/api/client'
const encryptStorage = new EncryptStorage(import.meta.env.VITE_ENCRYPT_STORAGE)
import { notify } from '@/Global/Toasters'

export const keysToUse = {
  systemSettings: 'systemSettings',
  userPermissions: 'userPermissions',
  loginUserData: 'loginUserData',
  loggedInAsStudentOrStaff: 'loggedInAsStudentOrStaff',
  IpEverLoged: 'IpEverLoged',
  SystemBranding: "SystemBranding" + getSubdomainName()
}
export function dateTime(time: string) {
  return tryCatch(() => {
    if (`${time}`.trim()?.length < 9) return ''
    const date = new Date(time)
    const formatted = date.toISOString().replace('T', ' ').substring(0, 19)
    return formatted
  })
}
export function date(time: string) {
  return tryCatch(() => {
    if (`${time}`.trim()?.length < 9) return ''

    const date = new Date(time)
    const formatted = date.toISOString().split('T')[0]
    return formatted
  })
}

// ============================================================

/***
 * ****/
export function tryCatch<T>(callback: () => Promise<T> | T) {
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
    console.log(userData)

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
    const data = encryptStorage.getItem(keysToUse.systemSettings);
    return data[key];
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
export  function hasPermission(permission: string) {
  try {
    if(!`${permission}`.trim()?.length){
      return true /// means its a global permission to be accessed 
    }
    const list =  localStoragePicker(keysToUse.userPermissions);
    const userPermissions = Array.isArray(list) ? list : JSON.parse(list || '[]');
    return !userPermissions.includes(permission)
  } catch (error) {
    console.error('Error :', error)
  }
}
export function appendOnAjsonStore(props: { data: any, key: string } = { data: {}, key: "" }) {
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
export  function localStoragePicker(key = '') {
  try {
    const data = encryptStorage.getItem(key)
    return data || []
  } catch (error) {
    console.error('Error fetching from storage:', error)
    return []
  }
}

/////////

export function addCommasCurrency(number: any, delimeter = ',') {
  return `${number}`.toString().replace(/\B(?=(\d{3})+(?!\d))/g, delimeter)
}
export function addMinutesToTime(startTime: string, minutesToAdd: number | string = 40) {
  const [hours = 0, minutes = 0] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + parseFloat(String(minutesToAdd))
  const endHours = Math.floor(totalMinutes / 60) % 24 // keep within 24h
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

export async function downloadFile(url: string, Action = 'download', type = 'pdf') {
  const appName = import.meta.env.VITE_APP_NAME // Example of accessing environment variable
  const valueres = await customAxios.get(url, { responseType: 'blob' })
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
  const filename = `${appName}${Date.now()}.` + type
  const blob = new Blob([valueres.data], {
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
  } catch (e) { }
  return jsonString
}
export function formDataFormatV2(fields: any[]) {
  const fd = new FormData()

  fields.forEach((field) => {
    const key = field.name.toLocaleLowerCase().replace('\+S', '_')
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

  return fd
}

export function formDataFormat(data: any) { // first version
  let formData = new FormData()

  // //console.log(data)
  for (let key in data) {
    let value = data[key]

    if (Array.isArray(value)) {
      // Handle arrays
      value.forEach((element, index) => {
        const lowerCaseKeys = `${key}[${index}]`.toLocaleLowerCase().replace('\+S', '_')
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
      const lowerCaseKeys = `${key}`.toLocaleLowerCase().replace('\+S', '_')
      formData.append(`${lowerCaseKeys}`.toLocaleLowerCase(), JSON.stringify(value))

    } else {
      const lowerCaseKeys = `${key}`.toLocaleLowerCase().replace('\+S', '_')
      // Handle primitive values and Files


      formData.append(lowerCaseKeys, value)
    }
  }

  return formData
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
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null
  const parts = hostname.split('.')
  const subdomain = parts.length >= 2 ? parts[0] : null
  if (!subdomain || ['admin', 'www', 'localhost'].includes(subdomain)) return null
  return subdomain
}

export function getSubdomainName() {
  const subdomain = getTenantSubdomain() ?? localStorage.getItem('tenant_subdomain')
  return subdomain
}

export function RouteStructure(route: any, routePath: string) {
  return {
    name: routePath.replaceAll('/', '-'),
    path: `/${routePath}`,
    component: route.component,
  }
}
export function routebuilder(routes = [], prifix = 'central') {
  const collecction: any = []
  routes.forEach((route) => {
    if (!route?.children) {
      // console.log(route);
      
      const routePath = route.path?`${prifix}/${route.path}`:null
      //  if(hasPermission(route?.permissions))
      collecction.push(RouteStructure(route, routePath))
    } else if (Array.isArray(route.children)) {
      route.children.forEach((child) => {
        if (child?.items) {
          child.items.forEach((item) => {
            // const childRoutePath = `${prifix}/${item.path}`
             const childRoutePath = item.path?`${prifix}/${item.path}`:null
              // if (hasPermission(route?.permissions))
            collecction.push(RouteStructure(item, childRoutePath))
          })
        }
      })
    }
  })
  return collecction
}

export function feedback(res: any, success: string, fail: string) {
  let successStatus = false
  console.log(res);

  let msg: Record<string, string> = {
    msg: success,
    type: 'Error',
    success: successStatus,
  }
  if (!res || res.code == 200) {
    successStatus = true
    msg = {
      msg: fail,
      type: 'Success',
      success: successStatus,
    }
  }
  notify(msg)
  return {
    success: successStatus,
    msg,
    res,
  }
}

export function createUrl(url: string, action: string) {
  const url2 = url.split("/")
  url2.length = url2.length - 1
  return url2.join("/") + `/${action}`
}
