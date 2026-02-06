'use client';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ 
      height: '100vh', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at center, #ffffff 0%, #f0f7ff 100%)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center', animation: 'fadeIn 2s ease-in' }}>
        <h1 style={{ 
          fontSize: '4rem', fontWeight: '900', letterSpacing: '-2px',
          background: 'linear-gradient(45deg, #e91e9a, #87ceeb)', 
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '10px'
        }}>
          FreeHugsOnly
        </h1>
        <p style={{ color: '#b2bec3', fontSize: '1.1rem', marginBottom: '40px', letterSpacing: '2px' }}>
          THE SUGAR CLOUD PROTOCOL
        </p>
        
        <button 
          onClick={() => router.push('/feed')}
          style={{ 
            padding: '15px 40px', fontSize: '1rem', fontWeight: 'bold',
            background: 'white', color: '#e91e9a', border: '1px solid #f8a5c2',
            borderRadius: '30px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
            transition: '0.3s'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          Enter as Witness
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
