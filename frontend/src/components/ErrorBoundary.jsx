import React from 'react';
import { AlertTriangle, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { safeStorageClear } from '../utils/storage';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleResetCacheAndReload = () => {
    safeStorageClear();
    window.location.href = window.location.pathname;
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const fallbackTitle = this.props.moduleTitle || 'This Module';

      return (
        <div className="error-boundary-wrapper" role="alert" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
          margin: '1.5rem auto',
          maxWidth: '720px',
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            marginBottom: '1.25rem'
          }}>
            <AlertTriangle size={36} />
          </div>

          <h2 style={{
            fontSize: '1.35rem',
            fontWeight: 700,
            color: 'var(--text-primary, #0f172a)',
            marginBottom: '0.5rem'
          }}>
            ஏதோ தவறு நிகழ்ந்துவிட்டது / Something went wrong
          </h2>

          <p style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary, #64748b)',
            marginBottom: '1.5rem',
            maxWidth: '540px',
            lineHeight: 1.5
          }}>
            {fallbackTitle} சந்தித்துள்ள எதிர்பாராத பிழையால் இந்த பகுதி தற்காலிகமாக தடைபட்டுள்ளது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.
            <br />
            An unexpected error occurred while rendering {fallbackTitle}. The rest of the PHC Network application remains operational.
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleReset}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} /> மீண்டும் முயற்சிக்கவும் (Try Recovering)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={this.handleReload}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              புதுப்பிக்கவும் (Reload Page)
            </button>
            <button
              type="button"
              className="btn"
              onClick={this.handleResetCacheAndReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#dc2626',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
              title="Clears corrupted local demo state and resets to fresh defaults"
            >
              <Trash2 size={16} /> தரவு சேமிப்பை மீட்டமை (Reset Cache)
            </button>
          </div>

          {/* Collapsible Error Technical Stack */}
          {this.state.error && (
            <div style={{ width: '100%', marginTop: '1rem', textAlign: 'left' }}>
              <button
                type="button"
                onClick={this.toggleDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  margin: '0 auto'
                }}
              >
                <span>{this.state.showDetails ? 'Hide technical diagnostics' : 'Show technical diagnostics'}</span>
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {this.state.showDetails && (
                <pre style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  background: 'var(--bg-dark, #0f172a)',
                  color: '#f87171',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  maxHeight: '180px',
                  lineHeight: 1.4
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
