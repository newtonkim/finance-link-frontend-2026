import './assets/main.css'
import 'vue-sonner/style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import {  vauth, vsetting,Button } from './Global' 
import { TableDrawer,Table, StatusButtonsHorizontal, CopyData,TabelActionButtons } from '@/Global'

const app = createApp(App)
const pinia = createPinia() 
app.use(pinia)
.use(router)
.component('DatePicker', VueDatePicker)
.component('Button', Button)
.component('TableDrawer', TableDrawer)
.component('StatusButtonsHorizontal', StatusButtonsHorizontal)
.component('CopyData', CopyData)
.component('Table', Table)
.component('TabelActionButtons', TabelActionButtons)

.directive('auth', vauth)
.directive('setting', vsetting)
const authStore = useAuthStore(pinia)
authStore.hydrateAuth()

app.mount('#app')
