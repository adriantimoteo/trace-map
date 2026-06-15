import { renderHook, act } from '@testing-library/react'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useLocationWorker } from './useLocationWorker'
import { useDataDispatch } from '../contexts/DataContext'
import { useUIDispatch } from '../contexts/UIContext'

// ---------------------------------------------------------------------------
// Mock the context dispatch hooks
// ---------------------------------------------------------------------------

const mockDataDispatch = vi.fn()
const mockUIDispatch = vi.fn()

vi.mock('../contexts/DataContext', () => ({
  useDataDispatch: vi.fn(),
}))

vi.mock('../contexts/UIContext', () => ({
  useUIDispatch: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Worker mock
// ---------------------------------------------------------------------------

class MockWorker {
  postMessage = vi.fn()
  terminate = vi.fn()
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null

  simulateMessage(data: unknown) {
    this.onmessage?.({ data } as MessageEvent)
  }

  constructor() {
    mockWorkerInstances.push(this)
  }
}

// Typed array so we avoid `any` assertions
const mockWorkerInstances: MockWorker[] = []

// ---------------------------------------------------------------------------
// FileReader mock
// ---------------------------------------------------------------------------

class MockFileReader {
  result: string | ArrayBuffer | null = null
  onload: ((ev: ProgressEvent<FileReader>) => void) | null = null
  onerror: ((ev: ProgressEvent<FileReader>) => void) | null = null

  readAsText = vi.fn()
  readAsArrayBuffer = vi.fn()

  simulateLoad(result: string | ArrayBuffer) {
    this.result = result
    this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>)
  }

  simulateError() {
    this.onerror?.({} as ProgressEvent<FileReader>)
  }

  constructor() {
    mockFileReaderInstances.push(this)
  }
}

// Typed array so we avoid `any` assertions
const mockFileReaderInstances: MockFileReader[] = []

// ---------------------------------------------------------------------------
// Helper: make a File
// ---------------------------------------------------------------------------

function makeFile(name: string, type: string, content = '{}') {
  return new File([content], name, { type })
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  mockWorkerInstances.length = 0
  mockFileReaderInstances.length = 0

  vi.mocked(useDataDispatch).mockReturnValue(mockDataDispatch)
  vi.mocked(useUIDispatch).mockReturnValue(mockUIDispatch)

  vi.stubGlobal('Worker', MockWorker)
  vi.stubGlobal('FileReader', MockFileReader)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useLocationWorker', () => {
  describe('pre-flight validation', () => {
    it('rejects a non-JSON file and dispatches SET_ERROR', () => {
      const { result } = renderHook(() => useLocationWorker())

      act(() => {
        result.current.loadFile(makeFile('photo.png', 'image/png'))
      })

      expect(mockDataDispatch).toHaveBeenCalledWith({ type: 'RESET' })
      expect(mockDataDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_ERROR' }))
      // No Worker should have been created
      expect(mockWorkerInstances).toHaveLength(0)
    })

    it('rejects a file not starting with { and dispatches SET_ERROR', () => {
      const { result } = renderHook(() => useLocationWorker())

      act(() => {
        result.current.loadFile(makeFile('data.json', 'application/json', '[1,2,3]'))
      })

      // Trigger the FileReader onload with content that does NOT start with '{'
      expect(mockFileReaderInstances).toHaveLength(1)
      act(() => {
        mockFileReaderInstances[0].simulateLoad('[1,2,3]')
      })

      expect(mockDataDispatch).toHaveBeenCalledWith({ type: 'RESET' })
      expect(mockDataDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_ERROR' }))
      expect(mockWorkerInstances).toHaveLength(0)
    })
  })

  describe('valid file', () => {
    it('dispatches RESET, SET_FILE_META, SET_STATUS:parsing in order', () => {
      const { result } = renderHook(() => useLocationWorker())
      const file = makeFile('Records.json', 'application/json')

      act(() => {
        result.current.loadFile(file)
      })

      // Simulate successful validation read (first FileReader = slice reader)
      act(() => {
        mockFileReaderInstances[0].simulateLoad('{"locations":[]}')
      })

      // Simulate successful file buffer read (second FileReader)
      act(() => {
        mockFileReaderInstances[1].simulateLoad(new ArrayBuffer(8))
      })

      type DispatchCall = { type: string; payload?: unknown }
      const calls = mockDataDispatch.mock.calls.map((c: [DispatchCall]) => c[0])
      const resetIdx = calls.findIndex((c) => c.type === 'RESET')
      const metaIdx = calls.findIndex((c) => c.type === 'SET_FILE_META')
      const statusIdx = calls.findIndex((c) => c.type === 'SET_STATUS')

      expect(resetIdx).toBeGreaterThanOrEqual(0)
      expect(metaIdx).toBeGreaterThan(resetIdx)
      expect(statusIdx).toBeGreaterThan(metaIdx)

      expect(calls[metaIdx]).toEqual({
        type: 'SET_FILE_META',
        payload: { fileName: 'Records.json', fileSize: file.size },
      })
      expect(calls[statusIdx]).toEqual({ type: 'SET_STATUS', payload: 'parsing' })
    })

    it('creates a Worker and sends LOAD_FILE', () => {
      const { result } = renderHook(() => useLocationWorker())
      const file = makeFile('Records.json', 'application/json')

      act(() => {
        result.current.loadFile(file)
      })

      act(() => {
        mockFileReaderInstances[0].simulateLoad('{"locations":[]}')
      })

      act(() => {
        mockFileReaderInstances[1].simulateLoad(new ArrayBuffer(8))
      })

      expect(mockWorkerInstances).toHaveLength(1)
      expect(mockWorkerInstances[0].postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'LOAD_FILE' }),
      )
    })
  })

  describe('Worker COMPLETE message', () => {
    it('dispatches SET_COMPLETE and SET_SCREEN:app', () => {
      const { result } = renderHook(() => useLocationWorker())

      act(() => {
        result.current.loadFile(makeFile('Records.json', 'application/json'))
      })
      act(() => {
        mockFileReaderInstances[0].simulateLoad('{"locations":[]}')
      })
      act(() => {
        mockFileReaderInstances[1].simulateLoad(new ArrayBuffer(8))
      })

      mockDataDispatch.mockClear()
      mockUIDispatch.mockClear()

      act(() => {
        mockWorkerInstances[0].simulateMessage({
          type: 'COMPLETE',
          payload: {
            totalCount: 42,
            minDate: '2020-01-01T00:00:00Z',
            maxDate: '2020-12-31T00:00:00Z',
          },
        })
      })

      expect(mockDataDispatch).toHaveBeenCalledWith({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 42,
          minDate: '2020-01-01T00:00:00Z',
          maxDate: '2020-12-31T00:00:00Z',
        },
      })
      expect(mockUIDispatch).toHaveBeenCalledWith({ type: 'SET_SCREEN', payload: 'app' })
      expect(mockWorkerInstances[0].terminate).toHaveBeenCalled()
    })
  })

  describe('Worker ERROR message', () => {
    it('dispatches SET_ERROR', () => {
      const { result } = renderHook(() => useLocationWorker())

      act(() => {
        result.current.loadFile(makeFile('Records.json', 'application/json'))
      })
      act(() => {
        mockFileReaderInstances[0].simulateLoad('{"locations":[]}')
      })
      act(() => {
        mockFileReaderInstances[1].simulateLoad(new ArrayBuffer(8))
      })

      mockDataDispatch.mockClear()

      act(() => {
        mockWorkerInstances[0].simulateMessage({
          type: 'ERROR',
          payload: { message: 'No locations array found in file' },
        })
      })

      expect(mockDataDispatch).toHaveBeenCalledWith({
        type: 'SET_ERROR',
        payload: 'No locations array found in file',
      })
      expect(mockWorkerInstances[0].terminate).toHaveBeenCalled()
    })
  })

  describe('Worker PROGRESS message', () => {
    it('dispatches SET_PROGRESS', () => {
      const { result } = renderHook(() => useLocationWorker())

      act(() => {
        result.current.loadFile(makeFile('Records.json', 'application/json'))
      })
      act(() => {
        mockFileReaderInstances[0].simulateLoad('{"locations":[]}')
      })
      act(() => {
        mockFileReaderInstances[1].simulateLoad(new ArrayBuffer(8))
      })

      mockDataDispatch.mockClear()

      act(() => {
        mockWorkerInstances[0].simulateMessage({
          type: 'PROGRESS',
          payload: { stage: 'parsing', percent: 25, pointsProcessed: 1000 },
        })
      })

      expect(mockDataDispatch).toHaveBeenCalledWith({
        type: 'SET_PROGRESS',
        payload: { progress: 25, pointsProcessed: 1000 },
      })
    })
  })

  describe('Worker BATCH message', () => {
    it('dispatches APPEND_BATCH', () => {
      const { result } = renderHook(() => useLocationWorker())

      act(() => {
        result.current.loadFile(makeFile('Records.json', 'application/json'))
      })
      act(() => {
        mockFileReaderInstances[0].simulateLoad('{"locations":[]}')
      })
      act(() => {
        mockFileReaderInstances[1].simulateLoad(new ArrayBuffer(8))
      })

      mockDataDispatch.mockClear()

      const points = [{ lat: 51.5, lng: -0.1, timestamp: 1_000_000, speed: null }]
      act(() => {
        mockWorkerInstances[0].simulateMessage({ type: 'BATCH', payload: { points } })
      })

      expect(mockDataDispatch).toHaveBeenCalledWith({ type: 'APPEND_BATCH', payload: points })
    })
  })

  describe('Worker STAGE2_APPLIED message', () => {
    it('dispatches STAGE2_APPLIED', () => {
      const { result } = renderHook(() => useLocationWorker())

      act(() => {
        result.current.loadFile(makeFile('Records.json', 'application/json'))
      })
      act(() => {
        mockFileReaderInstances[0].simulateLoad('{"locations":[]}')
      })
      act(() => {
        mockFileReaderInstances[1].simulateLoad(new ArrayBuffer(8))
      })

      mockDataDispatch.mockClear()

      act(() => {
        mockWorkerInstances[0].simulateMessage({
          type: 'STAGE2_APPLIED',
          payload: { sampledCount: 500 },
        })
      })

      expect(mockDataDispatch).toHaveBeenCalledWith({ type: 'STAGE2_APPLIED' })
    })
  })

  describe('cancellation', () => {
    it('sends CANCEL to the existing Worker and terminates it before starting a new one', () => {
      const { result } = renderHook(() => useLocationWorker())

      // First file
      act(() => {
        result.current.loadFile(makeFile('first.json', 'application/json'))
      })
      act(() => {
        mockFileReaderInstances[0].simulateLoad('{"locations":[]}')
      })
      act(() => {
        mockFileReaderInstances[1].simulateLoad(new ArrayBuffer(8))
      })

      expect(mockWorkerInstances).toHaveLength(1)
      const firstWorker = mockWorkerInstances[0]

      // Second file — should cancel the first Worker
      act(() => {
        result.current.loadFile(makeFile('second.json', 'application/json'))
      })
      act(() => {
        mockFileReaderInstances[2].simulateLoad('{"locations":[]}')
      })
      act(() => {
        mockFileReaderInstances[3].simulateLoad(new ArrayBuffer(8))
      })

      expect(firstWorker.postMessage).toHaveBeenCalledWith({ type: 'CANCEL' })
      expect(firstWorker.terminate).toHaveBeenCalled()
      expect(mockWorkerInstances).toHaveLength(2)
    })
  })
})
