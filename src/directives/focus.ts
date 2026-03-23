/**
 * Trigger focus event when component is loaded.
 */
export default {
  mounted (el: HTMLElement) {
    if (el instanceof HTMLDivElement) {
      const component = el.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
      component?.focus()
    } else {
      el.focus()
    }
  },
}
