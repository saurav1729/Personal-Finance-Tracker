'use client'
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { LogIn, Coins, TrendingUp, TrendingDown } from 'lucide-react'
import FinanceTracker from "./components/financeTracker"
import Image from "next/image"


export default function Home() {
  return (
    <div className="min-h-screen flex flex-col  bg-gradient-to-br from-blue-800 via-[#2a2a2a] to-[#1c1c1c]">
      {/* Header */}
      <header className="w-full bg-white/10 backdrop-blur-md shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <svg
                className="w-7 h-7 sm:w-8 sm:h-8 text-teal-300"
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
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">MoneyMap</h1>
              <p className="text-xs text-teal-300">Smart Financial Tracking</p>
            </div>
          </div>

          {/* Right side - Auth Button */}
          <div className="w-full sm:w-auto flex justify-center sm:justify-end">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full sm:w-auto bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-white font-medium py-2 px-4 rounded-full transition duration-300 ease-in-out flex items-center justify-center space-x-2 shadow-lg">
                  <LogIn className="w-5 h-5" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "w-10 h-10 rounded-full border-2 border-teal-300 hover:border-teal-400 transition duration-300 ease-in-out",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </header>

      <div className="fixed w-screen  h-screen flex justify-center items-center">
        {/* 3D Financial Visual Component */}
        <div className="relative w-full flex justify-center items-center py-12">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            {/* Main 3D Piggy Bank / Gullak */}
            <div className="absolute inset-0 flex items-center justify-center ">
              <div className="relative">
                {/* Piggy Bank Body */}
                <div className="w-[40vw] h-[40vh] mt-[15%] flex justify-center items-center  " style={{ transformStyle: 'preserve-3d' }}>
                  {/* Piggy Bank Details */}
                  <Image
                    src="/images/money_bank.png" // relative to public/
                    alt="Profile Picture"
                    width={400}
                    height={500}
                  />
                </div>

              </div>
            </div>

            {/* Floating Coins */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {/* Coin 1 */}
              <div className="absolute top-0 left-1/4 animate-coin1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-700 border-4 border-yellow-900 shadow-lg flex items-center justify-center">
                  <span className="text-yellow-900 font-bold text-lg">₹</span>
                </div>
              </div>

              {/* Coin 2 */}
              <div className="absolute top-1/4 right-0 animate-coin2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-700 border-4 border-yellow-900 shadow-lg flex items-center justify-center">
                  <span className="text-yellow-900 font-bold text-lg">₹</span>
                </div>
              </div>

              {/* Coin 3 */}
              <div className="absolute bottom-0 left-10 animate-coin3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-700 border-4 border-yellow-900 shadow-lg flex items-center justify-center">
                  <span className="text-yellow-900 font-bold text-lg">₹</span>
                </div>
              </div>
            </div>



            {/* Glowing Effect */}
            <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow z-10 px-4 sm:px-6 lg:px-8 py-8">
        <FinanceTracker />
      </main>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-md py-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white/60 text-sm">
          <p>© {new Date().getFullYear()} MoneyMap. All rights reserved.</p>
          <p className="mt-2">Take control of your finances with smart tracking and insights.</p>
        </div>
      </footer>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        
        @keyframes coin1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-20px, 20px) rotate(180deg); }
        }
        
        @keyframes coin2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(20px, 20px) rotate(-180deg); }
        }
        
        @keyframes coin3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-10px, -30px) rotate(180deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-coin1 {
          animation: coin1 8s ease-in-out infinite;
        }
        
        .animate-coin2 {
          animation: coin2 7s ease-in-out infinite;
        }
        
        .animate-coin3 {
          animation: coin3 9s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}