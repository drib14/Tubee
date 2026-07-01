import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Coffee, Sparkles } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const channelId = searchParams.get('channelId');
  const amount = searchParams.get('amount') || '50';

  useEffect(() => {
    // Save payment status locally for comments badges verification
    if (channelId) {
      const verifiedContributions = JSON.parse(localStorage.getItem('contributions') || '{}');
      verifiedContributions[channelId] = true;
      localStorage.setItem('contributions', JSON.stringify(verifiedContributions));
      
      // Also update verified payment status inside comment posts
      localStorage.setItem('isVerifiedSupporter', 'true');
    }
    
    // Auto redirect to home or back to channel/video page after a few seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 4000);

    return () => clearTimeout(timer);
  }, [channelId, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '75vh',
      gap: '20px',
      textAlign: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: 'rgba(194, 178, 128, 0.15)',
        padding: '30px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <Coffee size={60} style={{ color: 'var(--coffee-200)' }} />
        <Sparkles size={24} style={{ color: 'var(--accent-light)', position: 'absolute', top: '10px', right: '10px' }} />
      </div>
      
      <div>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '2rem', marginBottom: '8px' }}>Contribution Successful!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '450px', margin: '0 auto' }}>
          Thank you for supporting this channel with a contribution of **₱{amount}** PHP verified via Paymongo. 
          A supporter badge has been added to your profile!
        </p>
      </div>

      <button onClick={() => navigate('/')} className="btn btn-primary" style={{ padding: '10px 24px' }}>
        Back to Home
      </button>
    </div>
  );
};

export default PaymentSuccess;
