import React from 'react'
import Header from './_components/Header'

function DashboardLayout({children}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header/>
      <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3 sm:py-6">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout