export interface LocationPoint {
  lat: number
  lng: number
  timestamp: number // Unix ms
  speed: number | null // km/h, null if not computable
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface DateBucket {
  start: Date
  end: Date
  label: string
}

export type WorkerInboundMessage =
  | {
      type: 'LOAD_FILE'
      payload: {
        buffer: ArrayBuffer
        dedupDistance: number
        dedupTime: number
        format: 'auto' | 'records'
      }
    }
  | { type: 'CANCEL' }

export type WorkerOutboundMessage =
  | {
      type: 'PROGRESS'
      payload: {
        stage: 'parsing' | 'deduplicating' | 'sampling'
        percent: number
        pointsProcessed: number
      }
    }
  | { type: 'BATCH'; payload: { points: LocationPoint[] } }
  | { type: 'STAGE2_APPLIED'; payload: { sampledCount: number } }
  | { type: 'COMPLETE'; payload: { totalCount: number; minDate: string; maxDate: string } }
  | { type: 'ERROR'; payload: { message: string } }
