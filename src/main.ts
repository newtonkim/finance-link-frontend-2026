import './assets/main.css'
import 'vue-sonner/style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import { authDirective, getSubdomainName } from './Global'
import { setUpAxiosToUse } from 'septor-store'
// import { tenantClient } from './tenant/apis/tenantClient'
// import { apiClient } from './central/api/client'
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
.use(router)
.component('DatePicker', VueDatePicker)
.directive('auth', authDirective)



const authStore = useAuthStore(pinia)
authStore.hydrateAuth()

app.mount('#app')
