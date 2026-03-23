import { capitalCase, kebabCase } from 'change-case'
import fnDebounce from 'lodash/debounce'
import { nanoid } from 'nanoid'
import { useRoute, useRouter } from 'vue-router'
import DateFormatter from './fmt/date'
import NumberFormatter from './fmt/number'

/**
 * Since unhandled rejection error is quite annoying when developer
 * doesn't need the return value, the promise will NOT be rejected
 * if the function is canceled by default. You need to specify
 * the option rejectOnCancel: true to capture the rejection.
 */
// const debouncedRequest = useDebounceFn(() => 'response', 1000, { rejectOnCancel: true })
export const debounce = fnDebounce

export const fmt = {
  ...DateFormatter,
  ...NumberFormatter,
  kebabCase,
  titleCase: capitalCase,
  uppercase: (str: string) => str.toUpperCase(),
}

export const randomId = nanoid

export const useUpdateRoute = () => {
  const route = useRoute()
  const router = useRouter()
  const updateRoute = (query: object) =>
    router.push({
      query: { ...route.query, ...query, page: undefined },
    })
  return { updateRoute }
}
