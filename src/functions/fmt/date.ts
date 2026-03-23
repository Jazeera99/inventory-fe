import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// by providing a default string of 'PP' or any of its variants for `formatStr`
// it will format dates in whichever way is appropriate to the locale
const formatDate = (dt: string | number | Date, fmt: string = 'PP') => {
  return format(dt, fmt, { locale: id })
}
export default {
  /**
   * Format date with given string format. Set locale to id
   * See https://date-fns.org/docs/format for accepted tokens
   */
  date: formatDate,
}

export const dateStart = () => {
  const params = new URLSearchParams(window.location.search)
  const dateStartParam = params.get('date_start')

  if (dateStartParam) {
    return new Date(dateStartParam)
  }

  return undefined
}

export const dateEnd = () => {
  const params = new URLSearchParams(window.location.search)
  const dateEndParam = params.get('date_end')

  if (dateEndParam) {
    return new Date(dateEndParam)
  }

  return undefined
}
