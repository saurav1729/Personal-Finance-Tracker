import FinanceTracker from "./components/financeTracker"

export default function Home() {
  return (
    <main className="min-h-screen w-screen bg-gradient-to-br from-purple-700 via-blue-800 to-teal-500 flex items-center justify-center p-4">
      <FinanceTracker />
    </main>
  )
}