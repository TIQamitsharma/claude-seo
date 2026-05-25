'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Download } from 'lucide-react'

export default function RawDataToggle({ rawData }: { rawData: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)

  function handleDownload() {
    const blob = new Blob([JSON.stringify(rawData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="font-semibold text-slate-900">Technical Details</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Raw crawl data</span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100">
          <div className="flex justify-end px-6 pt-4">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          </div>
          <div className="p-6 pt-3">
            <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg p-4 overflow-x-auto max-h-96 leading-relaxed">
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
