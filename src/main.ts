import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import Chip from 'primevue/chip'
import InputNumber from 'primevue/inputnumber'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.component('Button', Button)
app.component('Card', Card)
app.component('InputText', InputText)
app.component('Tag', Tag)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Chip', Chip)
app.component('InputNumber', InputNumber)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.dark'
        }
    }
})

app.mount('#app')