import { tenantClient } from '../tenantClient'

export interface PublicHoliday {
  id: number
  name: string
  date: string
  recurring: boolean
}

export interface HolidaySettings {
  push_installments_on_holidays: boolean
  push_installments_on_holidays_weekdays_only?: boolean
  relative_scheduling?: boolean
}

export const publicHolidaysApi = {
  list() {
    return tenantClient.get<{ data: PublicHoliday[], settings: HolidaySettings }>('/public-holidays')
  },

  create(data: Omit<PublicHoliday, 'id'>) {
    return tenantClient.post('/public-holidays', data)
  },

  delete(id: number) {
    return tenantClient.delete(`/public-holidays/${id}`)
  },

  update(id: number, data: Partial<PublicHoliday>) {
    return tenantClient.put(`/public-holidays/${id}`, data)
  },

  updateSettings(settings: HolidaySettings) {
    return tenantClient.put('/public-holidays/settings', settings)
  }
}
