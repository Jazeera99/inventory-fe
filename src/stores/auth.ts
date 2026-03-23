import { defineStore } from 'pinia'

interface Branch {
  id: number,
  code: string,
}

interface Point {
  amount: number,
  rank: number,
  different_from_first_place: number,
}

// Update AuthenticatedUser
export type AuthenticatedUser = {
  id: number,
  name: string,
  username: string,
  role: string,
  branch?: Branch,
  point?: Point,
}

type State = {
  user: AuthenticatedUser,
  authenticated: -1 | 0 | 1,
}

export const useAuthStore = defineStore('Auth', {
  state: (): State => ({
    user: {
      id: 0,
      name: '',
      username: '',
      role: '',
      point: {
        amount: 0,
        rank: 0,
        different_from_first_place: 0,
      },
    },
    authenticated: -1,
  }),
  actions: {
    setUser (user: Partial<AuthenticatedUser>) {
      // Logic spread ini akan otomatis memasukkan objek branch ke dalam state user
      this.user = { ...this.user, ...user }
    },
    setAuthenticated (authenticated: -1 | 0 | 1) {
      this.authenticated = authenticated
    },
  },
})
