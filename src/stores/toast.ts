import { defineStore } from 'pinia'

type Toast = {
  id: string,
  message: string,
}
type State = {
  items: Toast[],
}

export const useToastStore = defineStore('Toast', {
  state: (): State => ({
    items: [],
  }),
  actions: {
    add (message: string) {
      // id for v-for key
      this.items.push({ message, id: Date.now().toString() })
      // 3s + 25ms per letters up to 5s
      const duration = Math.min(3000 + message.length * 25, 5000)
      setTimeout(() => {
        this.items.shift()
      }, duration)
    },
  },
})

export const toast = {
  dataSaved () {
    const store = useToastStore()
    store.add('Data berhasil disimpan')
  },
  dataDeleted () {
    const store = useToastStore()
    store.add('Data berhasil dihapus')
  },
  dataRestored () {
    const store = useToastStore()
    store.add('Data berhasil dipulihkan')
  },
}
