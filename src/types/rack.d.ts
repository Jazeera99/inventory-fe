type Rack = {
  id: number
  location_code: string
  rack_name: string
  column_number: number
  level_number: number
  is_active: boolean
  is_maintenance: boolean
  created_at: string
}

type RackFormData = {
  rack_name: string
  location_code?: string
  column_number: number
  level_number: number
  is_active?: boolean
  is_maintenance?: boolean
}

type RackBulkGeneratePayload = {
  rack_name: string
  total_column: number
  total_level: number
}

// type RackResponse = {
//   data: Rack
// }

// type RackListResponse = {
//   data: Rack[]
//   links: {
//     first: string
//     last: string
//     prev: string | null
//     next: string | null
//   }
//   meta: {
//     current_page: number
//     from: number
//     last_page: number
//     path: string
//     per_page: number
//     to: number
//     total: number
//   }
// }

// import { Rack as IRack } from '../types/rack';

// export class RackModel implements IRack {
//   id: number;
//   location_code: string;
//   rack_name: string;
//   column_number: number;
//   level_number: number;
//   is_active: boolean;
//   is_maintenance: boolean;
//   created_at: string;

//   constructor(data: IRack) {
//     this.id = data.id;
//     this.location_code = data.location_code;
//     this.rack_name = data.rack_name;
//     this.column_number = data.column_number;
//     this.level_number = data.level_number;
//     this.is_active = data.is_active;
//     this.is_maintenance = data.is_maintenance;
//     this.created_at = data.created_at;
//   }

//   /**
//    * Mendapatkan label status untuk UI
//    */
//   get statusLabel(): string {
//     if (this.is_maintenance) return 'Dalam Perbaikan';
//     return this.is_active ? 'Aktif' : 'Non-Aktif';
//   }

//   /**
//    * Mendapatkan warna status (untuk Tailwind/CSS)
//    */
//   get statusColor(): string {
//     if (this.is_maintenance) return 'bg-yellow-500';
//     return this.is_active ? 'bg-green-500' : 'bg-red-500';
//   }
// }
