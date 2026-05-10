import { computed, onBeforeMount, onMounted, ref, watch } from 'vue'
import {
  formDataFormatV2,
  createUrl,
  feedback,
  printElement,
  downloadFile,
  printElementId,
} from '@/Global'
import { pomPinia } from 'septor-store'
import { ACTION_CONFIG, dataTabelFilter, fetchTableData } from './index'
import { formawtacher } from '@/Global/Forminputs/formWatcher'
import { set } from 'lodash'

export default function useTableHelpers(props?: any, emit?: any) {
  const formStore = formawtacher()

  const drawerOpen = ref(false)
  const showDelete = ref(false)
  const searchQuery = ref('')
  const deepSearch = ref(false)
  // const emit = defineEmits(['save', 'submit', 'update:title']);
  const selected = ref<Record<string, unknown> | null>(null)
  const Store = pomPinia()
  const buttonTypeClicked = ref<any>(null)
  const DrawerMounted = ref<boolean>(true)
  const submitChanges = ref<any>(null)
  const provideDataTotheParent = ref<any>([])
  const finalSubmitAction = ref<string | null>(null)
  const drawerTitle = ref(props?.drawerTitle)
  const drawerShooter2 = ref<boolean | null>(true)
  const drawerWidth = ref(props?.drawerWidth)
  const currentPage = ref(1)
  const dropdownDownload = [
    { label: 'PDF', value: 'PDF', route: 'export-pdf' },
    { label: 'Excel', value: 'xlsx', route: 'export-excel' },
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

  async function handlePrint(values: any, url = null) {
    if (values.value) {
      const res = await fetchTableData({
        data: {
          page: currentPage.value,
          scale: values.value,
          ...values,
        },
        props: {
          ...(props ?? {}),
          state: values.value,
          url: url ?? createUrl(props?.url, 'print'),
        },
        Store,
      })
      const response = feedback(res)
      if (response.success || response.res) {
        printElement(response.res.payload ?? response.res, {
          size: values.value,
          orientation: 'landscape',
        })
      }
      // window.print();
    }
  }
  async function handleDownload(item: any) {
    if (item?.url) {
      downloadFile({
        Store: Store as any,
        customUrl: item?.url,
        data: { ...item, page: currentPage.value, search_keyword: searchQuery.value },
        Action: 'download',
        type: item.value,
      })
    } else if (item.action) {
      buttonTypeClicked.value = item.value
      item.action(item)
      return
    } else {
      downloadFile({
        Store: Store as any,
        url: createUrl(props.url, item.route, 'download'),
        data: { ...item, page: currentPage.value, search_keyword: searchQuery.value },
        Action: 'download',
        type: item.value,
      })
    }
  }
  function handleImport(item: any) {
    if (item.action) {
      buttonTypeClicked.value = item.value
      item.action(item)
      return
    } else handleTableAction(null, item.route, item?.drawer)
    // else handleTableAction(null, item.route,false)
  }

  // const title

  async function handleTableAction(item: any, action: string, drawer = true) {
    // alert()
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
          //   reload: false, // dont refectch data
          state: props.url + '_' + action,
          url: createUrl(props.url, action),
        },
        Store,
      })
      drawerTitle.value = 'import columns'
      provideDataTotheParent.value = res?.payload?.data ?? res?.payload ?? res
    }
    buttonTypeClicked.value = action
    if (drawer) toggleDrawer()
    drawerShooter2.value = false
  }

  const toggleDrawer = () => {
    // console.log(  drawerOpen.value );

    drawerOpen.value = !drawerOpen.value
    if (drawerOpen.value) {
      //////
      formStore.currentFormValues = {}
      // (Store as any).currentFormValues = {}
    }
  }
  function save(data: unknown, type = 'save') {
    // alert(type)
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
    // drawerShooter2.value = type !== 'view'
    emit('save', type, data, submitChanges.value)
  }

  async function automaticCreateFun(data: any) {
    // console.log(props.automaticCreate,"props.automaticCreate");

    // if (props.automaticCreate) {
    // const data = Store.currentFormValues
    let customeUrl = props?.actionSlot ?? props?.outerlinks?.['create'] ?? 'create'
    if (props?.actionSlot) {
      customeUrl = props?.actionSlot
    } else if (props?.outerlinks?.['create']) {
      customeUrl = props.outerlinks['create']
    } else {
      customeUrl = 'create'
    }
    let NewUrl = null
    if (props?.outerpathlinks?.['create']) {
      NewUrl = props?.outerpathlinks?.['create']
    } else {
      NewUrl = createUrl(props?.url, customeUrl)
    }
    const formDataScoping: any = formDataFormatV2(data)
    formStore.loading = true
    const res = await fetchTableData({
      data: formDataScoping,
      props: {
        ...props,
        state: props?.state,
        url: NewUrl,
      },
      Store,
    })
    formStore.loading = false
    const response = feedback(res)
    // console.log({response,data});

    if (response.success) {
      Store[props?.state] = res
      toggleDrawer()
      ;(window as any).setTimeout(() => {
        submitChanges.value = false
      }, 2000)
      // setTimeout(() => {
      //   toggleDrawer()
      // }, 100) //  to make sure the drawer is cleaned
      formStore.currentFormValues = {}
      // (Store as any).currentFormValues = {}
      // alert(buttonTypeClicked.value)
      buttonTypeClicked.value = buttonTypeClicked.value
      return true
    }
    return false
    // }
  }
  async function saveDrawerData(data: any) {
    formStore.isFormSubmitted = true
    setTimeout(async () => {
      const AnyErrorsFoundInTheFOrm = formStore.AnyErrorsFoundInTheFOrm
      const formdata = formStore.currentFormValues

      console.log(formdata, '====2');
      if (AnyErrorsFoundInTheFOrm) {
      } else {
        if (props.automaticCreate) {
          await automaticCreateFun(formdata)
          // no matter what stop  here

          return
        } else if (finalSubmitAction.value == 'import-data') {
          return
        }
        // emit('submit', data, submitChanges.value)

        save(formdata, finalSubmitAction.value ?? 'create')
        // save(data, finalSubmitAction.value ?? 'create')
        buttonTypeClicked.value = buttonTypeClicked.value
        // alert()
        // setTimeout(() => {
        //   submitChanges.value = false
        // }, 2000)
        // if (props.drawerRemount) {
        //   // alert("drawerRemount")
        //   toggleDrawer()
        //   setTimeout(() => {
        //     toggleDrawer()
        //   }, 100)
        // }
        // if all it ok
        //Store.isSubmitted==false;
      }
    }, 800)
  }
  const handleAction = async (item: any, action: keyof typeof ACTION_CONFIG) => {
    const fn = (ACTION_CONFIG?.[action] as { action?: (payload: any) => void } | undefined)?.action
    if (action === 'delete') {
      showDelete.value = true
      selected.value = item
      if (props?.state && props?.url) {
        return // dont send the  action to the parent
      }
    } else if (['share'].includes(action)) {
      const act = props?.outerlinks?.[action] ?? action
      const res = await fetchTableData({
        data: item,
        props: {
          ...props,
          state: props?.state + '_' + act,
          url: createUrl(props?.url, act),
        },
        Store,
      })
    } else if (['edit', 'view'].includes(action)) {
      DrawerMounted.value = false
        // alert()
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

        if (!res?.error) {
          provideDataTotheParent.value = res?.payload ?? res
        } else {
          provideDataTotheParent.value = item
        }
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
    currentPage.value = page as number
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
    deepSearch.value = true
    save(data, type)
    setTimeout(() => {
      deepSearch.value = false
    }, 2000)
  }
  const dataFilter = computed(() => {
    // alert(props?.state)
    const collection = (props?.state
      ? (Store[props.state as keyof typeof Store] as any)?.payload
      : null) ??
      props.data ?? { data: [] }
    // console.log(deepSearch.value,searchQuery.value);
    const filteredData = dataTabelFilter(
      collection?.data ?? collection,
      searchQuery.value,
      deepSearch.value,
    )

    return filteredData
  })
  const dataPageLinks = computed(() => {
    return (
      (props?.state ? (Store[props.state as keyof typeof Store] as any)?.payload : null) ??
      props.data ?? { data: [] }
    )
  })
  function filterDataByString(value: string) {
    // deepSearch.value = true
    searchQuery.value = value
  }

  onBeforeMount(() => {
    callOnmount()
  })
  watch(
    () => (Store as any).activeBranch,
    () => {
      refresh()
    },
  )
  watch(
    () => props?.url,
    () => {
      callOnmount()
    },
  )
  watch(
    () => props?.drawerShowFooter,
    (vl) => {
      drawerShooter2.value = vl // on side of central it help
    },
    {
      immediate: true,
      deep: true,
    },
  )
  watch(
    () => drawerOpen.value,
    (v) => {
      drawerTitle.value = props.drawerTitle
      drawerWidth.value = props.drawerWidth
      drawerShooter2.value == null
        ? (drawerShooter2.value = props?.drawerShowFooter)
        : drawerShooter2.value
      // if (drawerShooter2.value == null) {
      //   drawerShooter2.value = props?.drawerShowFooter
      // }else {
      //   drawerShooter2.value = drawerShooter2.value
      // }
      if (!v) {
        //reset the drawer data when the drawer is closed
        provideDataTotheParent.value = null
        drawerShooter2.value = null
        // buttonTypeClicked.value = null
        // drawerWidth.value = null
      }
    },
  )
  function callOnmount() {
    if (props?.state && props?.url) fetchTableData({ data: null, props, Store })

    drawerShooter2.value = props?.drawerShowFooter
  }

  function refresh() {
    if (props?.state && props?.url)
      fetchTableData({ data: null, props: { ...props, reload: false, time: 0 }, Store })
  }

  function haspermission(permission: string = '') {
    return props.permissions?.[permission]
  }
  function printDataInDrawer() {
    printElementId('print-container-drawer', { size: 'A4', orientation: 'landscape' })
  }

  return {
    dataPageLinks,
    printDataInDrawer,
    submitChanges,
    dataFilter,
    handleAction,
    changeThePage,
    callNewPage,
    onSearch,
    save,
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
  }
}
