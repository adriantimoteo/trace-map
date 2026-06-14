import type {
  LocationPoint,
  MapBounds,
  DateBucket,
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from './index'

it('types module exports all required types', () => {
  // Compile-time check only — if types are malformed, tsc will fail this import
  const _typeCheck:
    | [LocationPoint, MapBounds, DateBucket, WorkerInboundMessage, WorkerOutboundMessage]
    | null = null
  expect(_typeCheck).toBeNull()
})
