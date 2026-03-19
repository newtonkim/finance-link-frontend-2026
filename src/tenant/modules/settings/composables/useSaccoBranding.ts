import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { saccoBrandingApi } from '@/tenant/apis/saccobranding/saccoBrandingApi'

export function useSaccoBranding() {
  const showDrawer = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const name = ref('')
  const tagline = ref('')
  const logoFile = ref<File | null>(null)
  const logoPreview = ref<string | null>(null)
  const existingLogoUrl = ref<string | null>(null)
  const isDragging = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)

  function currentLogo() {
    return logoPreview.value ?? existingLogoUrl.value
  }

  function applyFile(file: File) {
    logoFile.value = file
    const reader = new FileReader()
    reader.onload = ev => { logoPreview.value = ev.target?.result as string }
    reader.readAsDataURL(file)
  }

  function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) applyFile(file)
  }

  function onDrop(e: DragEvent) {
    isDragging.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) applyFile(file)
  }

  function removeLogo() {
    logoFile.value = null
    logoPreview.value = null
    if (fileInput.value) fileInput.value.value = ''
  }

  async function openDrawer() {
    showDrawer.value = true
    loading.value = true
    try {
      const res = await saccoBrandingApi.get()
      const data = res.data?.data ?? res.data ?? null
      if (data) {
        name.value = data.sacco_name ?? ''
        tagline.value = data.tagline ?? ''
        existingLogoUrl.value = data.logo_url ?? null
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load branding.')
    } finally {
      loading.value = false
    }
  }

  function closeDrawer() {
    showDrawer.value = false
    logoFile.value = null
    logoPreview.value = null
  }

  async function save() {
    saving.value = true
    try {
      const res = await saccoBrandingApi.update({
        sacco_name: name.value,
        tagline: tagline.value,
        logo: logoFile.value,
      })
      const data = res.data?.data ?? res.data ?? null
      if (data) {
        existingLogoUrl.value = data.logo_url ?? null
        logoFile.value = null
        logoPreview.value = null
      }
      toast.success('Branding saved successfully.')
      closeDrawer()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save branding.')
    } finally {
      saving.value = false
    }
  }

  return {
    showDrawer, loading, saving,
    name, tagline, logoFile, logoPreview, existingLogoUrl, isDragging, fileInput,
    currentLogo, onFileChange, onDrop, removeLogo,
    openDrawer, closeDrawer, save,
  }
}
