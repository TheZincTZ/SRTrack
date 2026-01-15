'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { formatToSGT } from '@/lib/utils/timezone'

interface AttendanceRecord {
  id: string
  rank: string
  name: string
  number: string
  company: string
  clockInTime: string | null
  clockOutTime: string | null
  status: 'IN' | 'OUT'
  isOverdue: boolean
}

interface AttendanceTableProps {
  commander: {
    role: 'commander' | 'admin'
    company: string
  }
}

export default function AttendanceTable({ commander }: AttendanceTableProps) {
  const [data, setData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  // For commanders, use their company. For admins, default to 'all'
  const [selectedCompany, setSelectedCompany] = useState<string>(
    commander.role === 'admin' ? 'all' : commander.company
  )
  const [selectedDate, setSelectedDate] = useState<string>(formatToSGT(new Date(), 'yyyy-MM-dd'))

  // Memoize commander props to prevent unnecessary re-renders
  const commanderRole = useMemo(() => commander.role, [commander.role])
  const commanderCompany = useMemo(() => commander.company, [commander.company])

  const fetchAttendance = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        date: selectedDate,
      })
      
      if (commanderRole === 'admin' && selectedCompany !== 'all') {
        params.append('company', selectedCompany)
      }

      const response = await fetch(`/api/attendance?${params}`)
      const result = await response.json()

      if (response.ok) {
        setData(result.data || [])
      } else {
        console.error('Failed to fetch attendance:', result.error)
        setData([])
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, selectedDate, commanderRole])

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  const companies = ['A', 'B', 'C', 'Support', 'MSC', 'HQ']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Attendance Records</h2>
        <div className="flex space-x-4">
          {commander.role === 'admin' && (
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Companies</option>
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          )}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No attendance records found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((record) => (
                <tr
                  key={record.id}
                  className={record.isOverdue ? 'bg-red-100' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{record.rank}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{record.number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{record.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{record.clockInTime || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{record.clockOutTime || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'IN'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {record.status}
                    </span>
                    {record.isOverdue && (
                      <span className="ml-2 text-xs text-red-600 font-semibold">OVERDUE</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

