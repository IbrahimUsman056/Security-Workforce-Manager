import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff, 
  AlertCircle, Loader2, Building2, CalendarClock, ShieldAlert 
} from 'lucide-react';
import { useLoginMutation } from './authApi';
import { setCredentials } from './authSlice';
import { apiSlice } from '../../api/apiSlice';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ token: res.access_token, user: null }));
      const meRes = await dispatch(apiSlice.endpoints.getMe.initiate()).unwrap();
      dispatch(setCredentials({ token: res.access_token, user: meRes }));
      navigate('/');
    } catch (err) {
      setError(err?.data?.detail || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <style>{`
        .login-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f8fafc;
        }
/* PULSATING ANIMATION FOR TITLES */
        @keyframes pulse-title {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.2));
          }
          50% {
            opacity: 0.82;
            transform: scale(1.02);
            filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.5));
          }
        }

        @keyframes pulse-form-title {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.015);
          }
        }

        .pulsating-title {
          display: inline-block;
          animation: pulse-title 3s ease-in-out infinite;
          transform-origin: left center;
        }

        .pulsating-form-title {
          display: inline-block;
          animation: pulse-form-title 3s ease-in-out infinite;
          transform-origin: left center;
        }

        /* LEFT SIDE: HERO & BRANDING */
        .login-left {
          flex: 1;
          background-color: #0f172a;
          color: #ffffff;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-logo-badge {
          width: 92px;
          height: 92px;
          background-color: #0f172a;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden; /* Keeps image inside rounded corners */
          flex-shrink: 0;   /* Prevents icon box from squeezing on small screens */
          padding: 6px;     /* Gives logo clean breathing room inside badge */
          box-sizing: border-box;
        }

        .brand-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain; /* Ensures logo fits inside without stretching */
          display: block;
        }

        .brand-name {
          font-size: 40px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
          line-height: 1;
        }

        .hero-title {
          font-size: 20px;
          font-weight: 400;
          color: #cbd5e1; /* Soft light slate grey */
          opacity: 0.85;  /* Valid opacity value (0.0 to 1.0) */
          line-height: 1.25;
          margin: 0 0 16px 0;
          letter-spacing: -0.5px;
        }

        .hero-desc {
          font-size: 15px;
          line-height: 1.6;
          color: #94a3b8;
          margin: 0 0 36px 0;
          max-width: 460px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .feature-icon-box {
          width: 36px;
          height: 36px;
          background-color: rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #38bdf8;
        }

        .feature-text-title {
          font-size: 14px;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 2px;
        }

        .feature-text-sub {
          font-size: 13px;
          color: #94a3b8;
        }

        .system-status {
          font-size: 12.5px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background-color: #22c55e;
          border-radius: 50%;
        }

        /* RIGHT SIDE: FORM */
        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background-color: #ffffff;
          box-sizing: border-box;
        }

        .form-card {
          width: 100%;
          max-width: 380px;
        }

        .form-header {
          margin-bottom: 28px;
        }

        .form-title {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .form-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .error-alert {
          background-color: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 12px;
          border-radius: 8px;
          font-size: 13.5px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: #94a3b8;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 11px 12px 11px 38px;
          font-size: 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background-color: #ffffff;
          color: #0f172a;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .form-input:focus {
          border-color: #0f172a;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
        }

        .toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0;
          display: flex;
        }

        .submit-btn {
          width: 100%;
          padding: 12px;
          background-color: #0f172a;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
          transition: background-color 0.15s ease;
        }

        .submit-btn:hover:not(:disabled) {
          background-color: #1e293b;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .footer-links {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 13.5px;
          color: #64748b;
        }

        .footer-link {
          color: #991b1b;
          font-weight: 600;
          text-decoration: none;
        }

        .footer-link:hover {
          text-decoration: underline;
        }

        /* RESPONSIVE LAYOUT */
        @media (max-width: 900px) {
          .login-container {
            flex-direction: column;
            min-height: 100vh;
            height: auto;
          }
          .login-left {
            flex: none;
            padding: 28px 24px;
          }
          .login-left > div:first-child > div[style] {
            margin-top: 28px !important;
          }
          .hero-desc,
          .feature-list {
            display: none;
          }
          .hero-title {
            font-size: 16px;
            margin-bottom: 0;
          }
          .brand-name {
            font-size: 26px;
          }
          .brand-logo-badge {
            width: 56px;
            height: 56px;
          }
          .system-status {
            margin-top: 16px;
          }
          .login-right {
            flex: none;
            padding: 32px 20px 40px;
          }
        }

        @media (max-width: 480px) {
          .brand-name {
            font-size: 21px;
          }
          .hero-title {
            font-size: 14px;
          }
        }
      `}</style>

      {/* LEFT SIDE: Branding & Features */}
      <div className="login-left">
        <div>
          {/* Logo & Title Header */}
          <div className="brand-header">
            <div className="brand-logo-badge">
              <img src="/logo.png" alt="Logo" className="brand-logo-img pulsating-title" />
            </div>
            <span className="brand-name pulsating-title">Security Workforce Manager</span>
          </div>

          <div style={{ marginTop: '56px' }}>
            <p className="hero-title">
              Manage sites, automate shift schedules, track guard attendance, and streamline incident reporting in real-time.
            </p>

            {/* Concise Feature Bullets */}
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon-box" style={{ color: '#38bdf8' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="feature-text-title">Site & Shift Management</div>
                  <div className="feature-text-sub">Manage multiple sites and schedule staff shifts effortlessly.</div>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box" style={{ color: '#4ade80' }}>
                  <CalendarClock size={20} />
                </div>
                <div>
                  <div className="feature-text-title">Shift Swaps & Requests</div>
                  <div className="feature-text-sub">Allow guard swap requests with instant supervisor approvals.</div>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box" style={{ color: '#f87171' }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="feature-text-title">Incident Reports & Logs</div>
                  <div className="feature-text-sub">Log operational issues quickly with audit trail accountability.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Status */}
        <div className="system-status">
          <span className="status-dot"></span>
          <span>Operations Control Panel &middot; Online</span>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="login-right">
        <div className="form-card">
          <div className="form-header">
            <h2 className="form-title">Sign in</h2>
            <p className="form-subtitle">Enter your details to access your panel</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-alert">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer Registration Links */}
          <div className="footer-links">
            New here?{' '}
            <Link to="/register-org" className="footer-link">
              Register Organization
            </Link>
            {' '}or{' '}
            <Link to="/join" className="footer-link" style={{ color: '#0f172a' }}>
              Join Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}