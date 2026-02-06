import './globals.css'; // מוודא שכל ה-CSS הגלובלי נטען

export const metadata = {
  title: 'FreeHugsOnly | Sugar Cloud',
  description: 'An empowered witness experience in the generative sugar cloud.',
  icons: {
    // טריק להוספת אייקון ענן בלי קובץ חיצוני
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>☁️</text></svg>',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body 
        style={{ 
          margin: 0, 
          padding: 0, 
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          minHeight: '100vh'
        }}
      >
        {children}
      </body>
    </html>
  );
}
