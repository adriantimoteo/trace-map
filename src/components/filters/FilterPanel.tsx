import { FileMetaBadge } from '../common/FileMetaBadge'
import { SamplingNotice } from '../common/SamplingNotice'
import { PointCounter } from './PointCounter'
import { DateRangeFilter } from './DateRangeFilter'
import { VelocityFilter } from './VelocityFilter'
import { ViewportFilter } from './ViewportFilter'
import { AdvancedOptions } from './AdvancedOptions'
import { DisplayControls } from './DisplayControls'
import { useFilteredPoints } from '../../hooks/useFilteredPoints'

export function FilterPanel() {
  const { filteredCount } = useFilteredPoints()

  return (
    <aside className="flex flex-col gap-4 p-4">
      <h2 className="text-base font-semibold">Filters</h2>
      <FileMetaBadge />

      <DateRangeFilter />

      <VelocityFilter />

      <ViewportFilter />

      <DisplayControls />

      <AdvancedOptions />

      <div className="mt-auto flex flex-col gap-2">
        <SamplingNotice />
        <PointCounter visibleCount={filteredCount} />
      </div>
    </aside>
  )
}
