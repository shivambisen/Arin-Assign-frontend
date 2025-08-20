import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const withToken = (url: string, token: string | null) => {
  if (!token) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('token', token);
    return u.toString();
  } catch {
    return url;
  }
};

const MediaReel: React.FC = () => {
  const { mediaId } = useParams<{ mediaId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const baseURL = useMemo(() => (api.defaults.baseURL || '').replace(/\/$/, ''), []);
  const mediaUrl = useMemo(() => `${baseURL}/media/${mediaId}/file`, [baseURL, mediaId]);
  const [contentType, setContentType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  // removed Like state
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const probe = async () => {
      try {
        setLoading(true);
        const res = await api.head(`/media/${mediaId}/file`);
        if (!mounted) return;
        const ct = (res.headers['content-type'] as string) || '';
        setContentType(ct);
      } catch (e: any) {
        if (!mounted) return;
        setError(e.response?.data?.error || 'Failed to load media');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (mediaId) probe();
    return () => { mounted = false; };
  }, [mediaId]);

  const isImage = contentType.startsWith('image/');
  const isVideo = contentType.startsWith('video/');
  const urlWithToken = withToken(mediaUrl, token);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      try {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch {}
    }
  };

  const handleFullscreen = () => {
    const mediaElement = document.querySelector('video, img');
    if (mediaElement) {
      mediaElement.requestFullscreen();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Back button (top-left) */}
      <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 10 }}>
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          Back
        </button>
      </div>

      {/* Copy toast */}
      {copied && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '8px 12px', borderRadius: 8, zIndex: 20, fontSize: 12 }}>
          Link copied
        </div>
      )}

      {/* Main media area */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {loading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}>Loading...</div>
        ) : error ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b6b' }}>{error}</div>
        ) : (
          <>
            {isImage && (
              <img
                src={urlWithToken}
                alt={`media-${mediaId}`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )}
            {isVideo && (
              <video
                autoPlay
                muted
                loop
                playsInline
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
              >
                <source src={urlWithToken} />
              </video>
            )}

            {/* Right-side vertical actions (Share at top, Open below) */}
            <div style={{ position: 'absolute', right: 16, bottom: '18%', display: 'flex', flexDirection: 'column', gap: 12, zIndex: 5 }}>
              <button
                onClick={handleShare}
                title="Share"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 9999,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff'
                }}
              >
                ↗︎
              </button>
              <a
                href={urlWithToken}
                target="_blank"
                rel="noreferrer"
                onClick={handleFullscreen}
                title="Open"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 9999,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none'
                }}
              >
                ⤢
              </a>
            </div>

            {/* Bottom gradient caption */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '16px', zIndex: 4,
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.75) 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Media #{mediaId}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{contentType || 'unknown/unknown'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" onClick={handleShare}>Share</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MediaReel; 