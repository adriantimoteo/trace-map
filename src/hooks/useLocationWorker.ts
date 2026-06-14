import { useRef, useCallback } from 'react'
import { useDataDispatch } from '../contexts/DataContext'
import { useUIDispatch } from '../contexts/UIContext'
import type { WorkerOutboundMessage } from '../types'

const DEDUP_DISTANCE = 50 // metres
const DEDUP_TIME = 60_000 // ms

/**
 * Custom hook that encapsulates the Web Worker lifecycle for location file processing.
 * Returns a `loadFile` function that accepts a File and kicks off the full pipeline.
 */
export function useLocationWorker(): { loadFile: (file: File) => void } {
  const dataDispatch = useDataDispatch()
  const uiDispatch = useUIDispatch()
  const workerRef = useRef<Worker | null>(null)

  const loadFile = useCallback(
    (file: File) => {
      // --- Pre-flight validation ---

      // 1. Check MIME type or file extension
      const isJsonMime = file.type === 'application/json' || file.type === 'text/json'
      const isJsonExt = file.name.toLowerCase().endsWith('.json')
      if (!isJsonMime && !isJsonExt) {
        dataDispatch({ type: 'RESET' })
        dataDispatch({
          type: 'SET_ERROR',
          payload: 'Invalid file type. Please select a .json file.',
        })
        return
      }

      // 2. Read first 512 bytes and check that content starts with '{'
      const slice = file.slice(0, 512)
      const reader = new FileReader()

      reader.onload = () => {
        const text = (reader.result as string).trimStart()
        if (!text.startsWith('{')) {
          dataDispatch({ type: 'RESET' })
          dataDispatch({
            type: 'SET_ERROR',
            payload:
              'File does not appear to be a valid JSON object. Expected content starting with {.',
          })
          return
        }

        // Pre-flight passed — start the pipeline

        // Cancel any existing worker
        if (workerRef.current !== null) {
          workerRef.current.postMessage({ type: 'CANCEL' })
          workerRef.current.terminate()
          workerRef.current = null
        }

        // Dispatch initial DataContext actions
        dataDispatch({ type: 'RESET' })
        dataDispatch({
          type: 'SET_FILE_META',
          payload: { fileName: file.name, fileSize: file.size },
        })
        dataDispatch({ type: 'SET_STATUS', payload: 'parsing' })

        // Create the Worker
        const worker = new Worker(new URL('../workers/locationWorker.ts', import.meta.url), {
          type: 'module',
        })
        workerRef.current = worker

        worker.onmessage = (event: MessageEvent<WorkerOutboundMessage>) => {
          const msg = event.data

          switch (msg.type) {
            case 'PROGRESS':
              dataDispatch({
                type: 'SET_PROGRESS',
                payload: {
                  progress: msg.payload.percent,
                  pointsProcessed: msg.payload.pointsProcessed,
                },
              })
              break

            case 'BATCH':
              dataDispatch({ type: 'APPEND_BATCH', payload: msg.payload.points })
              break

            case 'STAGE2_APPLIED':
              dataDispatch({ type: 'STAGE2_APPLIED' })
              break

            case 'COMPLETE':
              dataDispatch({
                type: 'SET_COMPLETE',
                payload: {
                  totalCount: msg.payload.totalCount,
                  minDate: msg.payload.minDate,
                  maxDate: msg.payload.maxDate,
                },
              })
              uiDispatch({ type: 'SET_SCREEN', payload: 'app' })
              worker.terminate()
              workerRef.current = null
              break

            case 'ERROR':
              dataDispatch({ type: 'SET_ERROR', payload: msg.payload.message })
              worker.terminate()
              workerRef.current = null
              break
          }
        }

        worker.onerror = (event) => {
          dataDispatch({
            type: 'SET_ERROR',
            payload: event.message || 'An unknown worker error occurred.',
          })
          worker.terminate()
          workerRef.current = null
        }

        // Read the full file and send to the Worker
        const fileReader = new FileReader()
        fileReader.onload = () => {
          if (workerRef.current === null) return // was cancelled
          worker.postMessage({
            type: 'LOAD_FILE',
            payload: {
              buffer: fileReader.result as ArrayBuffer,
              format: 'records' as const,
              dedupDistance: DEDUP_DISTANCE,
              dedupTime: DEDUP_TIME,
            },
          })
        }
        fileReader.onerror = () => {
          dataDispatch({ type: 'SET_ERROR', payload: 'Failed to read file.' })
          worker.terminate()
          workerRef.current = null
        }
        fileReader.readAsArrayBuffer(file)
      }

      reader.onerror = () => {
        dataDispatch({ type: 'RESET' })
        dataDispatch({ type: 'SET_ERROR', payload: 'Failed to read file for validation.' })
      }

      reader.readAsText(slice)
    },
    [dataDispatch, uiDispatch],
  )

  return { loadFile }
}
