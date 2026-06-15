import { useUIState, useUIDispatch } from '../../contexts/UIContext'

export function FormatSelector() {
  const { fileFormat } = useUIState()
  const dispatch = useUIDispatch()

  function handleChange(value: 'auto' | 'records') {
    dispatch({ type: 'SET_FILE_FORMAT', payload: value })
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">File format</span>
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            name="file-format"
            value="auto"
            checked={fileFormat === 'auto'}
            onChange={() => {
              handleChange('auto')
            }}
          />
          Auto-detect
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            name="file-format"
            value="records"
            checked={fileFormat === 'records'}
            onChange={() => {
              handleChange('records')
            }}
          />
          Records.json
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input
            type="radio"
            name="file-format"
            value="semantic"
            checked={fileFormat === 'semantic'}
            disabled
            onChange={() => {}}
          />
          Semantic Location History
          <span className="text-xs text-gray-400">coming soon</span>
        </label>
      </div>
    </div>
  )
}
