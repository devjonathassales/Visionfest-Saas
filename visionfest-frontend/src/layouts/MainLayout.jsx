import React from 'react';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-primary text-white p-4 font-montserrat text-xl">
        VisionFest
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
