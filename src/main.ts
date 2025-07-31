import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import './styles/leaflet-fix.css'
import './styles/globals.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
