<template>
  <div
    class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
  >
    <div class="flex items-center gap-3">
      <div class="p-2 bg-indigo-50 rounded-lg">
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
            />
          </svg>
        </slot>
      </div>
      <h2 class="text-lg font-black text-gray-800 tracking-tight uppercase">Filter Data</h2>
    </div>

    <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
      <div
        class="flex flex-col bg-gray-50 border border-gray-200 rounded-xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-all min-w-[320px]"
      >
        <span class="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1"
          >Periode Transaksi</span
        >

        <VueDatePicker
          v-model="dateRange"
          range
          :multi-calendars="false"
          :enable-time-picker="true"
          format="dd/MM/yyyy HH:mm"
          placeholder="Pilih Rentang Tanggal"
          auto-apply
          :close-on-auto-apply="false"
          input-class-name="datepicker-input-custom"
          menu-class-name="datepicker-menu-custom"
        >
          <template #time-picker="{ hours, minutes, updateHours, updateMinutes }: any">
            <div class="side-time-panel">
              <div class="time-col">
                <span class="time-header">JAM</span>
                <div class="time-list">
                  <button
                    v-for="h in 24"
                    :key="h"
                    :class="['t-btn', { active: hours === h - 1 }]"
                    @click="updateHours(h - 1)"
                  >
                    {{ String(h - 1).padStart(2, '0') }}
                  </button>
                </div>
              </div>
              <div class="time-col">
                <span class="time-header">MNT</span>
                <div class="time-list">
                  <button
                    v-for="m in 12"
                    :key="m"
                    :class="['t-btn', { active: minutes === (m - 1) * 5 }]"
                    @click="updateMinutes((m - 1) * 5)"
                  >
                    {{ String((m - 1) * 5).padStart(2, '0') }}
                  </button>
                </div>
              </div>
            </div>
          </template>
        </VueDatePicker>
      </div>

      <div class="relative flex-1 lg:w-64">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-width="2" />
          </svg>
        </div>
        <input
          type="text"
          :value="modelValue.sku"
          @input="updateSku(($event.target as HTMLInputElement).value)"
          placeholder="Ketik SKU Produk..."
          class="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { format } from 'date-fns'

interface FilterModel {
  start: string
  end: string
  sku: string
}

const props = defineProps<{ modelValue: FilterModel }>()
const emit = defineEmits(['update:modelValue'])

const dateRange = ref<[Date, Date] | null>(
  props.modelValue.start && props.modelValue.end
    ? [new Date(props.modelValue.start), new Date(props.modelValue.end)]
    : null,
)

watch(dateRange, (newRange) => {
  if (newRange && newRange[0] && newRange[1]) {
    emit('update:modelValue', {
      ...props.modelValue,
      start: format(newRange[0], 'yyyy-MM-dd HH:mm:ss'),
      end: format(newRange[1], 'yyyy-MM-dd HH:mm:ss'),
    })
  } else {
    emit('update:modelValue', { ...props.modelValue, start: '', end: '' })
  }
})

const updateSku = (val: string) => {
  emit('update:modelValue', { ...props.modelValue, sku: val })
}
</script>

<style>
/* 1. Memaksa layout menu menjadi horizontal (Samping-sampingan) */
.dp__menu {
  display: flex !important;
  flex-direction: row !important;
  padding: 0 !important;
}

/* Memastikan wrapper konten di dalamnya juga flex */
.dp__menu_content_wrapper {
  display: flex !important;
  flex-direction: row !important;
}

/* Memberi garis pembatas antara kalender dan panel jam */
.dp__instance_calendar {
  border-right: 1px solid #f3f4f6;
  padding: 12px;
}

/* 2. Styling Panel Waktu di Samping */
.side-time-panel {
  display: flex;
  background: #fff;
  padding: 12px 8px;
  gap: 8px;
  height: 320px; /* Menyesuaikan tinggi kalender */
}

.time-col {
  display: flex;
  flex-direction: column;
  width: 40px;
}

.time-header {
  font-size: 10px;
  font-weight: 800;
  color: #9ca3af;
  text-align: center;
  margin-bottom: 10px;
}

.time-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 4px;
}

/* Scrollbar halus */
.time-list::-webkit-scrollbar {
  width: 3px;
}
.time-list::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}

.t-btn {
  padding: 6px 0;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
  color: #4b5563;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.t-btn:hover {
  background: #f3f4f6;
  color: #6366f1;
}

.t-btn.active {
  background: #6366f1 !important;
  color: #fff !important;
}

/* Input Styles */
.datepicker-input-custom {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  font-size: 0.875rem !important;
  font-weight: 700 !important;
  color: #374151 !important;
}
</style>
