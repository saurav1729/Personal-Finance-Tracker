import FinanceTracker from "./components/financeTracker"
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { LogIn } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-blue-800 to-teal-500">
      <header className="absolute top-0 left-0 w-full bg-white bg-opacity-10 backdrop-blur-md shadow-lg">
        <div className=" mx-auto px-[2rem] py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg
              className="w-8 h-8 text-teal-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-2xl font-bold text-white">MoneyMap</span>
          </div>
          <div>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out flex items-center space-x-2">
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 rounded-full border-2 border-teal-300 hover:border-teal-400 transition duration-300 ease-in-out"
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>
      </header>
      <main className="pt-20 mt-[25rem] md:mt-[18rem] xl:mt-[8rem] min-h-scren w-screen flex flex-col items-center justify-center p-4">
        <FinanceTracker />
      </main>
    </div>
  )
}