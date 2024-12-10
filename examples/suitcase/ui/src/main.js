import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify'; // Importa la configuración de Vuetify

createApp(App)
  .use(vuetify) // Usa Vuetify en la aplicación
  .mount('#app');
