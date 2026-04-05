import { computed, onMounted, ref, watch } from 'vue'
import { Plus } from 'lucide-vue-next'
import { formDataFormatV2, createUrl, feedback, printElement } from '@/Global'
import { pomPinia } from 'septor-store'
import { ACTION_CONFIG, dataTabelFilter, fetchTableData } from './index'
export default function useTableHelpers(props: any, emit: any) {
  const drawerOpen = ref(false)
  const showDelete = ref(false)
  const searchQuery = ref('')
  // const emit = defineEmits(['save', 'submit', 'update:title']);
  const selected = ref<Record<string, unknown> | null>(null)
  const Store = pomPinia()
  const buttonTypeClicked = ref<any>(null)
  const DrawerMounted = ref<boolean>(true)
  const submitChanges = ref<any>(null)
  const provideDataTotheParent = ref<any>([])

  const finalSubmitAction = ref<string>('')
  const drawerTitle = ref(props.drawerTitle)
  const drawerShooter2 = ref(props.drawerShowFooter)
  const drawerWidth = ref(props.drawerWidth)
  const currentPage = ref(1)
  const dropdownDownload = [
    { label: 'PDF', value: 'PDF', route: 'export-pdf' },
    { label: 'Excel', value: 'Excel', route: 'export-excel' },
  ]

  async function createNewRecord() {
    // alert('create new record')
    DrawerMounted.value = false
    await save('create', 'add')
    buttonTypeClicked.value = 'add'
    await toggleDrawer()
    provideDataTotheParent.value = null
    DrawerMounted.value = true
  }

  async function handlePrint(values: any) {
    if (values.value) {
      const res = await fetchTableData({
        data: {
          page: currentPage.value,
          scale: values.value,
        },
        props: {
          ...props,
          state: values.value,
          url: createUrl(props?.url, 'print'),
        },
        Store,
      })
      const response = feedback(res)

      if (response.success) {
        printElement(response.res.payload, { size: values.value, orientation: 'landscape' })
      }
      // window.print();
    }
  }
  function handleDownload(item: any) {
    if (item.action) {
      buttonTypeClicked.value = item.value
      item.action(item)
      // emit("save", type, data, submitChanges.value);
      return
    } else handleTableAction(null, item.route)
  }
  function handleImport(item: any) {
    if (item.action) {
      buttonTypeClicked.value = item.value
      item.action(item)
      return
    } else handleTableAction(null, item.route)
  }

  // const title

  async function handleTableAction(item: any, action: string) {
    drawerWidth.value = 'w-2/4'
    if (action == 'import-data') {
      finalSubmitAction.value = 'import-data'
      drawerTitle.value = 'import data'
    } else {
      const res = await fetchTableData({
        data: { ...item, page: currentPage.value, search_keyword: searchQuery.value },
        props: {
          ...props,
          reload: false, // dont refectch data
          state: props?.state + '_' + action,
          url: createUrl(props.url, action),
        },
        Store,
      })
      drawerTitle.value = 'import columns'
      provideDataTotheParent.value = res?.payload ?? res
    }
    buttonTypeClicked.value = action
    toggleDrawer()
    drawerShooter2.value = false
  }

  const toggleDrawer = () => {
    drawerOpen.value = !drawerOpen.value
    if (drawerOpen.value) {
      //////
      Store.currentFormValues = {}
    }
  }
  function save(data: unknown, type = 'save') {
    if (type == 'search' && props?.state && props?.url) {
      fetchTableData({ data, props, Store })
      return
    }
    if (type == 'delete' && props?.state && props?.url) {
      const newprosDta = { ...props, url: createUrl(props?.url, 'delete') }
      fetchTableData({ data, props: newprosDta, Store })
      return
    }
    if (type === 'create' || type === 'save') {
      submitChanges.value = true
      setTimeout(() => {
        submitChanges.value = false
      }, 1000)
    }
    drawerShooter2.value = type !== 'view'
    emit('save', type, data, submitChanges.value)
  }

  async function automaticCreateFun() {
    if (props.automaticCreate) {
      const data = Store.currentFormValues
      let customeUrl = props?.actionSlot ?? props?.outerlinks?.['create'] ?? 'create'
      if (props?.actionSlot) {
        customeUrl = props?.actionSlot
      } else if (props?.outerlinks?.['create']) {
        customeUrl = props.outerlinks['create']
      } else {
        customeUrl = 'create'
      }
      const formDataScoping: any = formDataFormatV2(data)
      const res = await fetchTableData({
        data: formDataScoping,
        props: {
          ...props,
          state: props?.state + '_' + customeUrl,
          url: createUrl(props?.url, customeUrl),
        },
        Store,
      })
      const response = feedback(res)

      if (response.success) {
        Store[props?.state] = res
        toggleDrawer()
        setTimeout(() => {
          submitChanges.value = false
        }, 2000)
        setTimeout(() => {
          toggleDrawer()
        }, 100) //  to make sure the drawer is cleaned
        Store.currentFormValues = {}
        buttonTypeClicked.value = buttonTypeClicked.value
        return true
      }
      return false
    }
  }
  async function saveDrawerData(data: any) {
    // alert()
    Store.isFormSubmitted = true
    const AnyErrorsFoundInTheFOrm = Store.AnyErrorsFoundInTheFOrm

    // if (AnyErrorsFoundInTheFOrm == undefined) {

    // } else
    if (AnyErrorsFoundInTheFOrm) {
    } else {
      const checker = await automaticCreateFun('create')

      if (checker) {
        // if (!checker) {
        // return
      } else if (finalSubmitAction.value == 'import-data') {
        return
      }
      // console.log(checker, '====2');

      save(data, finalSubmitAction.value ?? 'create')
      buttonTypeClicked.value = buttonTypeClicked.value

      setTimeout(() => {
        submitChanges.value = false
      }, 2000)
      if (props.drawerRemount) {
        // alert("drawerRemount")
        toggleDrawer()
        setTimeout(() => {
          toggleDrawer()
        }, 100)
      }
      // if all it ok
      //Store.isSubmitted==false;
    }
  }
  const handleAction = async (item: any, action: keyof typeof ACTION_CONFIG) => {
    const fn = (ACTION_CONFIG?.[action] as { action?: (payload: any) => void } | undefined)?.action
    if (action === 'delete') {
      showDelete.value = true
      selected.value = item
      if (props?.state && props?.url) {
        return // dont send the  action to the parent
      }
    } else if (['edit', 'view'].includes(action)) {
      DrawerMounted.value = false
      if (fn) fn(item)
      toggleDrawer() // open the drawer on this action clicked
      if (props?.state && props?.url && ['edit', 'view'].includes(action)) {
        let outerlinks = 'details'
        if (props?.outerlinks?.[action]) {
          outerlinks = props?.outerlinks[action]
        } else {
          if (action == 'edit') {
            outerlinks = 'edit-details'
          }
        }
        const res = await fetchTableData({
          data: item,
          props: {
            ...props,
            state: props?.state + '_' + outerlinks,
            url: createUrl(props?.url, outerlinks),
          },
          Store,
        })
        provideDataTotheParent.value = res?.payload ?? res
      }
      if (action == 'view') {
        drawerShooter2.value = false
      }

      DrawerMounted.value = true
    } else {
      if (fn) fn(item)
    }

    save(item ?? selected.value, String(action))
    buttonTypeClicked.value = action
  }
  const changeThePage = (page: unknown) => {
    currentPage.value = page
    if (page && props?.state && props?.url) {
      fetchTableData({
        data: {
          page,
          //    search_keyword:searchQuery.value  // i have avoided this coz it will look in the page  instead let goo globa
        },
        props,
        Store,
      })
    }
    // alert()
    save(page, 'changePage')
  }
  const callNewPage = changeThePage
  const onSearch = (type: string, data: unknown) => {
    save(data, type)
  }
  const dataFilter = computed(() => {
    const collection = (props?.state
      ? (Store[props.state as keyof typeof Store] as any)?.payload
      : null) ??
      props.data ?? { data: [] }

    return dataTabelFilter(collection?.data, searchQuery.value)
  })
  const dataPageLinks = computed(() => {
    return (
      (props?.state ? (Store[props.state as keyof typeof Store] as any)?.payload : null) ??
      props.data ?? { data: [] }
    )
  })
  function filterDataByString(value: string) {
    searchQuery.value = value
  }
  onMounted(async () => {
    callOnmount()
  })

  watch(
    () => props?.url,
    () => {
      callOnmount()
    },
  )
  watch(
    () => drawerOpen.value,
    (v) => {
      drawerTitle.value = props.drawerTitle
      //   drawerShooter2.value = props.drawerShowFooter
      drawerWidth.value = props.drawerWidth
      if (!v) {
        //reset the drawer data when the drawer is closed
        provideDataTotheParent.value = null
        buttonTypeClicked.value = null
        drawerWidth.value = null
      }
    },
  )
  function callOnmount() {
    if (props?.state && props?.url) fetchTableData({ data: null, props, Store })
  }

  function refresh() {
    if (props?.state && props?.url)
      fetchTableData({ data: null, props: { ...props, reload: false, time: 0 }, Store })
  }

  function haspermission(permission = '') {
    return props.permissions?.[permission]
  }

  return {
    dataPageLinks,
    submitChanges,
    dataFilter,
    handleAction,
    changeThePage,
    callNewPage,
    onSearch,
    drawerTitle,
    drawerShooter2,
    drawerWidth,
    DrawerMounted,
    drawerOpen,
    toggleDrawer,
    filterDataByString,
    refresh,
    currentPage,
    saveDrawerData,
    haspermission,
    searchQuery,
    selected,
    provideDataTotheParent,
    buttonTypeClicked,
    handleDownload,
    handleImport,
    handleTableAction,
    handlePrint,
    showDelete,
    ACTION_CONFIG,
    createNewRecord,
    dropdownDownload,
    DrawerMounted,
  }
}
