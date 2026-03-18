import './assets/main.css'
import 'vue-sonner/style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import { authDirective, vauth, vsetting } from './Global' 
const app = createApp(App)
const pinia = createPinia()
// vauth
// vsetting
app.use(pinia)
.use(router)
.component('DatePicker', VueDatePicker)
.directive('auth', vauth)
.directive('setting', vsetting)



const authStore = useAuthStore(pinia)
authStore.hydrateAuth()

app.mount('#app')
