import type { Repositories } from './contracts'
import { httpRepositories } from './http/http-repositories'
import { mockRepositories } from './mock/mock-repositories'

const source = import.meta.env.VITE_DATA_SOURCE ?? 'mock'

export const repositories: Repositories = source === 'api' ? httpRepositories : mockRepositories
export const dataSource = source
