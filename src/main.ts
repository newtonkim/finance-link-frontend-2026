import './assets/main.css'
import 'vue-sonner/style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import { TableDrawer,Table,Imploading, StatusButtonsHorizontal, CopyData,TabelActionButtons,DetailsTable,Form,PainPageHeader ,Drawer,vauth, vsetting,Button,AnalysisTile ,Card,Input} from '@/Global'



const app = createApp(App)
const pinia = createPinia() 
app.use(pinia)
.use(router)
.component('AnalysisTile', AnalysisTile)
.component('DatePicker', VueDatePicker)
.component('Button', Button)
.component('Card', Card)
.component('Input', Input)
.component('TableDrawer', TableDrawer)
.component('Drawer', Drawer)
.component('StatusButtonsHorizontal', StatusButtonsHorizontal)
.component('CopyData', CopyData)
.component('Table', Table)
.component('TabelActionButtons', TabelActionButtons)
.component('DetailsTable', DetailsTable)
.component('Form', Form)
.component('Imploading', Imploading)
.component('PainPageHeader', PainPageHeader)
.directive('auth', vauth)
.directive('setting', vsetting)
const authStore = useAuthStore(pinia)
authStore.hydrateAuth()

app.mount('#app')
