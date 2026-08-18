<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { format } from 'date-fns'

interface FilterModel {
  start?: string
  end?: string
}

// Tambahkan prop 'minimal' agar bisa dipanggil secara compact di fitur stock-order
const props = withDefaults(
  defineProps<{
    modelValue: FilterModel
    minimal?: boolean
  }>(),
  {
    minimal: false,
  },
)

const emit = defineEmits(['update:modelValue'])

const dateRange = ref<[Date, Date] | null>(null)
//let isUpdatingFromProps = false

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue?.start && newValue?.end) {
      //isUpdatingFromProps = true
      const startDate = new Date(newValue.start)
      const endDate = new Date(newValue.end)

      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const currentStart = dateRange.value?.[0] ? format(dateRange.value[0], 'yyyy-MM-dd') : ''
        const currentEnd = dateRange.value?.[1] ? format(dateRange.value[1], 'yyyy-MM-dd') : ''

        // Hanya ubah dateRange jika nilainya berbeda dari prop
        if (currentStart !== newValue.start || currentEnd !== newValue.end) {
          dateRange.value = [startDate, endDate]
        }
      } else if (dateRange.value !== null) {
        dateRange.value = null
      }
    } else if (!newValue?.start && !newValue?.end && dateRange.value !== null) {
      dateRange.value = null
    }
  },
  { immediate: true, deep: true },
)

watch(dateRange, (newRange) => {
  let startStr = ''
  let endStr = ''

  if (newRange && newRange[0] && newRange[1]) {
    try {
      startStr = format(newRange[0], 'yyyy-MM-dd')
      endStr = format(newRange[1], 'yyyy-MM-dd')
    } catch (e) {
      // Abaikan jika date invalid
    }
  }

  if (props.modelValue?.start !== startStr || props.modelValue?.end !== endStr) {
    emit('update:modelValue', { start: startStr, end: endStr })
  }
})

const clearFilter = () => {
  dateRange.value = null
  emit('update:modelValue', { start: '', end: '' })
}
</script>

<template>
  <!-- MODE MINIMAL (Hanya Input Kalender saja untuk stock-order) -->
  <div v-if="minimal" class="relative min-w-[240px]">
    <VueDatePicker
      v-model="dateRange"
      range
      :multi-calendars="false"
      :enable-time-picker="false"
      format="dd/MM/yyyy"
      placeholder="Tanggal Mulai s/d Selesai"
      auto-apply
      :close-on-auto-apply="true"
      input-class-name="datepicker-input-minimal"
    />
    <button
      v-if="dateRange"
      @click.stop="clearFilter"
      class="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full p-1 transition-colors z-10"
      title="Hapus Filter"
    >
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.5"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>

  <!-- MODE STANDARD (Tampilan biasa yang digunakan fitur-fitur lain) -->
  <div
    v-else
    class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"
  >
    <div class="flex items-center gap-3">
      <div class="p-2.5 bg-indigo-50 rounded-xl">
        <slot name="icon">
          <svg
            class="w-5 h-5 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </slot>
      </div>
      <div>
        <h2 class="text-sm font-bold text-gray-800 tracking-wide uppercase">Filter Transaksi</h2>
        <p class="text-xs text-gray-400">Cari berdasarkan rentang tanggal</p>
      </div>
    </div>

    <div class="flex items-center gap-2 w-full sm:w-auto">
      <div
        class="flex flex-col flex-1 sm:flex-none bg-gray-50 hover:bg-gray-100/70 border border-gray-200/80 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all min-w-[280px] sm:min-w-[340px] relative group"
      >
        <span
          class="text-[10px] font-bold text-indigo-500 tracking-wider uppercase leading-none mb-1.5"
          >Periode Tanggal</span
        >

        <VueDatePicker
          v-model="dateRange"
          range
          :multi-calendars="false"
          :enable-time-picker="false"
          format="dd/MM/yyyy"
          placeholder="Pilih Tanggal Mulai s/d Selesai"
          auto-apply
          :close-on-auto-apply="true"
          input-class-name="datepicker-input-custom"
          menu-class-name="datepicker-menu-custom"
        />

        <button
          v-if="dateRange"
          @click.stop="clearFilter"
          class="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full p-1 transition-colors z-10"
          title="Hapus Filter"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style>
/* Style input khusus untuk mode minimal */
.datepicker-input-minimal {
  background-color: #ffffff !important;
  border: 1px solid #d1d5db !important;
  border-radius: 0.5rem !important;
  padding: 0.5rem 0.75rem !important;
  font-size: 0.875rem !important;
  color: #374151 !important;
  height: 38px !important;
}

.dp__menu {
  display: flex !important;
  flex-direction: row !important;
  padding: 0 !important;
  border-radius: 16px !important;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #f3f4f6 !important;
  overflow: hidden;
}

.dp__menu_content_wrapper {
  display: flex !important;
  flex-direction: row !important;
}

.dp__instance_calendar {
  border-right: 1px solid #f3f4f6;
  padding: 16px;
}

.datepicker-input-custom {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  font-size: 0.875rem !important;
  font-weight: 700 !important;
  color: #1f2937 !important;
  width: 100% !important;
}
</style>
