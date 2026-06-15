import { FileMetaBadge } from '../common/FileMetaBadge'
import { SamplingNotice } from '../common/SamplingNotice'
import { PointCounter } from './PointCounter'
import { DateRangeFilter } from './DateRangeFilter'

export function FilterPanel() {
  return (
    <aside className="flex flex-col gap-4 p-4">
      <h2 className="text-base font-semibold">Filters</h2>
      <FileMetaBadge />

      <DateRangeFilter />

      <div className="mt-auto flex flex-col gap-2">
        <SamplingNotice />
        <PointCounter />
      </div>
    </aside>
  )
}
