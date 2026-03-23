import { type App } from 'vue'
import focus from './focus'

export default {
  install(app: App) {
    app.directive('focus', focus)
  },
}
