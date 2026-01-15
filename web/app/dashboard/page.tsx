import { redirect } from 'next/navigation'
import { getCommander } from '@/lib/auth'
import AttendanceTable from '@/components/AttendanceTable'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const commander = await getCommander()

  if (!commander) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SRTrack Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {commander.rank} {commander.full_name} ({commander.company})
              </span>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <AttendanceTable commander={commander} />
        </div>
      </main>
    </div>
  )
}

