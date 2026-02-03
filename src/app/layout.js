/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 */

import './globals.css';

export const metadata = {
  title: 'FHO: Free Hugs Only - Synaptic Cloud Engine',
  description: 'Standing on the shoulders of giants, without crushing them',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="p-4 bg-white/50 backdrop-blur-sm border-b border-honey/20">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-float">🍭</span>
              <div>
                <h1 className="text-xl font-bold text-gray-800">FHO: Free Hugs Only</h1>
                <p className="text-xs text-gray-500">Synaptic Cloud Engine • Handshaked 2026</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <a href="/" className="text-gray-600 hover:text-warm-glow transition-colors">Cloud</a>
              <a href="/fusion" className="text-gray-600 hover:text-warm-glow transition-colors">+ Fusion</a>
              <a href="/giants" className="text-gray-600 hover:text-warm-glow transition-colors">Giants</a>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-6">
          {children}
        </main>
        <footer className="p-4 text-center text-gray-500 text-sm">
          <p>🍭 Born in the FHO Sugar Cloud • FGL-2026 License</p>
          <p className="text-xs mt-1">10% to a Sweet Cause • Spinning for a Sweeter Future</p>
        </footer>
      </body>
    </html>
  );
}
