import { defineStore } from 'pinia'

type State = {
  title: string
}

const APP_TITLE = import.meta.env.VITE_APP_TITLE ?? ''

export const usePageStore = defineStore('Page', {
  state: (): State => ({
    title: '',
  }),
  actions: {
    setPageTitle(title: string) {
      this.title = title
      document.title = `${title} | ${APP_TITLE}`
    },
  },
})
