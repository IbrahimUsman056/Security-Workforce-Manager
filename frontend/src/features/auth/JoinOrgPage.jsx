import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Globe, User, Mail, Phone, Lock, 
  ArrowRight, AlertCircle, CheckCircle2, Loader2, 
  UserPlus, Shield, Clock 
} from 'lucide-react';
import { useJoinOrgMutation } from './authApi';

export default function JoinOrgPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', subdomain: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [joinOrg, { isLoading }] = useJoinOrgMutation();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await joinOrg(form).unwrap();
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="join-container">
      <style>{`
        .join-container {
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
        .join-left {
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
          overflow: hidden;
          flex-shrink: 0;
          padding: 6px;
          box-sizing: border-box;
        }

        .brand-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
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
          color: #cbd5e1;
          opacity: 0.85;
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
        .join-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background-color: #ffffff;
          box-sizing: border-box;
          overflow-y: auto;
        }

        .form-card {
          width: 100%;
          max-width: 400px;
        }

        .form-header {
          margin-bottom: 24px;
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

        .success-alert {
          background-color: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
          padding: 12px;
          border-radius: 8px;
          font-size: 13.5px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-group {
          margin-bottom: 16px;
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
          padding: 10px 12px 10px 38px;
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
          margin-top: 8px;
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
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 13.5px;
          color: #64748b;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .footer-link {
          color: #991b1b;
          font-weight: 600;
          text-decoration: none;
        }

        .footer-link:hover {
          text-decoration: underline;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* RESPONSIVE LAYOUT */
        @media (max-width: 900px) {
          .join-left {
            display: none;
          }
          .join-right {
            flex: 1;
          }
        }
      `}</style>

      {/* LEFT SIDE: Branding & Employee Onboarding Info */}
      <div className="join-left">
        <div>
          <div className="brand-header">
            <div className="brand-logo-badge">
              <img src="/logo.png" alt="Logo" className="brand-logo-img pulsating-title" />
            </div>
            <span className="brand-name pulsating-title">Security Workforce Manager</span>
          </div>

          <div style={{ marginTop: '56px' }}>
            <p className="hero-title">
              Connect with your company workspace to view schedules and submit reports.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon-box" style={{ color: '#38bdf8' }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <div className="feature-text-title">Fast Onboarding</div>
                  <div className="feature-text-sub">Enter your team's subdomain code to request team access instantly.</div>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box" style={{ color: '#4ade80' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div className="feature-text-title">Real-Time Shifts</div>
                  <div className="feature-text-sub">Access assigned shift times, locations, and roster changes.</div>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box" style={{ color: '#a855f7' }}>
                  <Shield size={20} />
                </div>
                <div>
                  <div className="feature-text-title">Role Authorization</div>
                  <div className="feature-text-sub">Gain security clearance assigned by your company administrator.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="system-status">
          <span className="status-dot"></span>
          <span>Team Member Onboarding Portal &middot; Ready</span>
        </div>
      </div>

      {/* RIGHT SIDE: Join Organization Form */}
      <div className="join-right">
        <div className="form-card">
          <div className="form-header">
            <h2 className="form-title">Join Your Organization</h2>
            <p className="form-subtitle">Enter your organization details to create your member profile</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-alert">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="success-alert">
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>Account created! Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Subdomain Input */}
            <div className="form-group">
              <label className="form-label">Organization Subdomain</label>
              <div className="input-wrapper">
                <Globe className="input-icon" size={18} />
                <input
                  name="subdomain"
                  type="text"
                  className="form-input"
                  placeholder="e.g. apex"
                  value={form.subdomain}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Full Name Input */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="form-group">
              <label className="form-label">Phone Number (Optional)</label>
              <div className="input-wrapper">
                <Phone className="input-icon" size={18} />
                <input
                  name="phone"
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={isLoading || success}>
              {isLoading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <span>Join Team</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer Registration Links */}
          <div className="footer-links">
            <div>
              Setting up a new organization?{' '}
              <Link to="/register-org" className="footer-link">
                Register here
              </Link>
            </div>
            <div>
              Already have an account?{' '}
              <Link to="/login" className="footer-link" style={{ color: '#0f172a' }}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}