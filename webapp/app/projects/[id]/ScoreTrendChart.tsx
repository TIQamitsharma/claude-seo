'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint {
  date: string
  score: number | null
  command: string
}

interface TooltipPayload {
  payload: DataPoint
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-900">{d.date}</p>
      <p className="text-slate-500">{d.command}</p>
      <p className={`font-bold mt-1 ${(d.score ?? 0) >= 80 ? 'text-emerald-600' : (d.score ?? 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
        Score: {d.score}/100
      </p>
    </div>
  )
}

export default function ScoreTrendChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={100}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={{ fill: '#0ea5e9', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#0284c7' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
