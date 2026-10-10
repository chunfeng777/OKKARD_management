import type { AuthState, LoginCommand, TwoFactorCommand } from '@/domain/auth'
import { repositories } from '@/services'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authState: { status: 'anonymous' } as AuthState,
    initialized: false,
    busy: false,
  }),
  getters: {
    isAuthenticated: (state) => state.authState.status === 'authenticated',
    isTwoFactorPending: (state) => state.authState.status === 'two_factor_required',
    currentAdmin: (state) =>
      state.authState.status === 'authenticated' ? state.authState.session.admin : null,
  },
  actions: {
    async initialize() {
      if (this.initialized) return
      const session = await repositories.auth.getSession()
      this.authState = session ? { status: 'authenticated', session } : { status: 'anonymous' }
      this.initialized = true
    },
    async signIn(command: LoginCommand) {
      this.busy = true
      try {
        const challenge = await repositories.auth.signIn(command)
        this.authState = { status: 'two_factor_required', challenge }
      } finally {
        this.busy = false
      }
    },
    async verifyTwoFactor(code: string) {
      if (this.authState.status !== 'two_factor_required') return
      this.busy = true
      try {
        const command: TwoFactorCommand = {
          challengeId: this.authState.challenge.challengeId,
          code,
        }
        const session = await repositories.auth.verifyTwoFactor(command)
        this.authState = { status: 'authenticated', session }
      } finally {
        this.busy = false
      }
    },
    async signOut() {
      this.busy = true
      try {
        await repositories.auth.signOut()
        this.authState = { status: 'anonymous' }
      } finally {
        this.busy = false
      }
    },
  },
})
