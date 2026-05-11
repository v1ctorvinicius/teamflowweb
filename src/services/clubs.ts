import { api } from './api'

export interface Club {
  id: number
  name: string
  slug: string
}

export const clubsService = {
  async list(): Promise<Club[]> {
    const { data } = await api.get<{ data: Club[] }>('/clubs')
    return data.data
  },
}