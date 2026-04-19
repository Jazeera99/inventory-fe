import { type App } from 'vue'
import FaIcon from './fa-icon.vue'
import AppStatcard from './app-statcard.vue'
import AppTable from './app-table.vue'
import AppInput from './app-input.vue'
import AppSearch from './app-search.vue'
import AppButton from './app-button.vue'
import AppStatusToggle from './app-status-toggle.vue'
import AppTableFilter from './app-table-filter.vue'
import AppInputSku from './app-input-sku.vue'
import AppAlert from './app-alert.vue'
import AppCard from './app-card.vue'

export default {
  install(app: App) {
    app.component('FaIcon', FaIcon)
    app.component('AppStatcard', AppStatcard)
    app.component('AppTable', AppTable)
    app.component('AppInput', AppInput)
    app.component('AppSearch', AppSearch)
    app.component('AppButton', AppButton)
    app.component('AppStatusToggle', AppStatusToggle)
    app.component('AppTableFilter', AppTableFilter)
    app.component('AppInputSku', AppInputSku)
    app.component('AppAlert', AppAlert)
    app.component('AppCard', AppCard)
  },
}

declare module 'vue' {
  export interface GlobalComponents {
    FaIcon: typeof FaIcon
    AppStatcard: typeof AppStatcard
    AppTable: typeof AppTable
    AppInput: typeof AppInput
    AppSearch: typeof AppSearch
    AppButton: typeof AppButton
    AppStatusToggle: typeof AppStatusToggle
    AppTableFilter: typeof AppTableFilter
    AppInputSku: typeof AppInputSku
    AppAlert: typeof AppAlert
    AppCard: typeof AppCard
  }
}
