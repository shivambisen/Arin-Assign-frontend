import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { metricsAPI } from '../services/api';
import type { Metric, CreateMetricData, MediaItem } from '../types';
// Removed unused Link import

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

const Metrics: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const { logout, user, token } = useAuth();

  // Form state
  const [formData, setFormData] = useState<CreateMetricData>({
    campaign_name: '',
    date: '',
    impressions: 0,
    clicks: 0,
    conversions: 0
  });
  const [formFiles, setFormFiles] = useState<File[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createUploadProgress, setCreateUploadProgress] = useState<number | null>(null);

  // Media state
  const [openMediaMetricId, setOpenMediaMetricId] = useState<number | null>(null);
  const [mediaByMetric, setMediaByMetric] = useState<Record<number, MediaItem[]>>({});
  const [uploadingForMetricId, setUploadingForMetricId] = useState<number | null>(null);
  const [uploadProgressByMetric, setUploadProgressByMetric] = useState<Record<number, number>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingUploadMetricIdRef = useRef<number | null>(null);

  // Fullscreen viewer
  const [fullscreenMedia, setFullscreenMedia] = useState<MediaItem | null>(null);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (fullscreenMedia && fullscreenRef.current && !document.fullscreenElement) {
      fullscreenRef.current.requestFullscreen?.().catch(() => {});
    }
  }, [fullscreenMedia]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        setFullscreenMedia(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await metricsAPI.getMetrics(filterCampaign);
      setMetrics(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [filterCampaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      let createdOrUpdated: Metric | null = null;
      if (editingMetric) {
        createdOrUpdated = await metricsAPI.updateMetric(editingMetric.id, formData);
      } else {
        createdOrUpdated = await metricsAPI.createMetric(formData);
      }

      // If creating a new metric and files are selected, upload them
      if (!editingMetric && createdOrUpdated && formFiles.length > 0) {
        const metricId = createdOrUpdated.id;
        setCreateUploadProgress(0);
        const { files: uploaded } = await metricsAPI.uploadMedia(metricId, formFiles, (percent) => {
          setCreateUploadProgress(percent);
        });
        setMediaByMetric((prev) => ({ ...prev, [metricId]: uploaded }));
        setOpenMediaMetricId(metricId);
      }

      // Refresh metrics and close form
      await loadMetrics();
      setShowAddForm(false);
      setEditingMetric(null);
      resetForm();
      setFormFiles([]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save metric');
    } finally {
      setIsCreating(false);
      setCreateUploadProgress(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this metric?')) {
      try {
        await metricsAPI.deleteMetric(id);
        loadMetrics();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete metric');
      }
    }
  };

  const handleEdit = (metric: Metric) => {
    setEditingMetric(metric);
    setFormData({
      campaign_name: metric.campaign_name,
      date: metric.date,
      impressions: metric.impressions,
      clicks: metric.clicks,
      conversions: metric.conversions
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      campaign_name: '',
      date: '',
      impressions: 0,
      clicks: 0,
      conversions: 0
    });
    setFormFiles([]);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingMetric(null);
    resetForm();
  };

  // Media helpers
  // Upload via hidden input is no longer triggered here (button removed in UI)

  const onFilesSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = e.target.files;
    const metricId = pendingUploadMetricIdRef.current;
    e.target.value = '';
    if (!files || !metricId) return;
    try {
      setUploadProgressByMetric((prev) => ({ ...prev, [metricId]: 0 }));
      const { files: uploaded } = await metricsAPI.uploadMedia(metricId, files, (percent) => {
        setUploadProgressByMetric((prev) => ({ ...prev, [metricId]: percent }));
      });
      setMediaByMetric((prev) => ({
        ...prev,
        [metricId]: [...(prev[metricId] || []), ...uploaded]
      }));
      setOpenMediaMetricId(metricId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload files');
    } finally {
      setUploadingForMetricId(null);
      setUploadProgressByMetric((prev) => ({ ...prev, [metricId!]: 100 }));
      setTimeout(() => {
        setUploadProgressByMetric((prev) => {
          const updated = { ...prev };
          delete updated[metricId!];
          return updated;
        });
      }, 600);
      pendingUploadMetricIdRef.current = null;
    }
  };

  // loadMedia is not directly triggered by a button anymore in this UI variant

  const copyShare = async (url: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard');
      }
    } catch {}
  };

  // Calculate stats
  const totalImpressions = metrics.reduce((sum, metric) => sum + metric.impressions, 0);
  const totalClicks = metrics.reduce((sum, metric) => sum + metric.clicks, 0);
  const totalConversions = metrics.reduce((sum, metric) => sum + metric.conversions, 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const avgConvRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00';

  return (
    <div className="metrics-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Campaign Analytics Dashboard</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px' }}>
            Welcome back, {user?.email}
          </p>
        </div>
        <button onClick={logout} className="btn-danger">
          Sign Out
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '16px', 
          marginBottom: '24px', 
          backgroundColor: 'rgba(255, 107, 107, 0.1)', 
          color: '#ff6b6b',
          borderRadius: '12px',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{totalImpressions.toLocaleString()}</div>
          <div className="stat-label">Total Impressions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalClicks.toLocaleString()}</div>
          <div className="stat-label">Total Clicks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalConversions.toLocaleString()}</div>
          <div className="stat-label">Total Conversions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgCTR}%</div>
          <div className="stat-label">Average CTR</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgConvRate}%</div>
          <div className="stat-label">Conversion Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{metrics.length}</div>
          <div className="stat-label">Active Campaigns</div>
        </div>
      </div>

      <div style={{ marginBottom: '24px', width: '100%' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Filter by campaign name..."
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            style={{
              flex: 1,
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              fontSize: '14px',
              backdropFilter: 'blur(10px)'
            }}
          />
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingMetric(null);
              resetForm();
            }}
            className="btn-success"
            style={{ padding: '16px 24px' }}
          >
            + Add Campaign
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '32px', width: '100%' }}>
          <h3 style={{ 
            marginBottom: '24px',
            fontSize: '20px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            {editingMetric ? 'Edit Campaign' : 'Add New Campaign'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-form">
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px'
                }}>
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
                  required
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px'
                }}>
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px'
                }}>
                  Impressions
                </label>
                <input
                  type="number"
                  value={formData.impressions}
                  onChange={(e) => setFormData({...formData, impressions: parseInt(e.target.value)})}
                  required
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px'
                }}>
                  Clicks
                </label>
                <input
                  type="number"
                  value={formData.clicks}
                  onChange={(e) => setFormData({...formData, clicks: parseInt(e.target.value)})}
                  required
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px'
                }}>
                  Conversions
                </label>
                <input
                  type="number"
                  value={formData.conversions}
                  onChange={(e) => setFormData({...formData, conversions: parseInt(e.target.value)})}
                  required
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px'
                }}>
                  Upload Media (optional)
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => setFormFiles(Array.from(e.target.files || []))}
                />
                {formFiles.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                    {formFiles.length} file(s) selected
                  </div>
                )}
                {createUploadProgress !== null && (
                  <div style={{ marginTop: '8px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${createUploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #4ecdc4, #667eea)', transition: 'width 120ms ease' }} />
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-primary" disabled={isCreating}>
                {editingMetric ? 'Update Campaign' : 'Add Campaign'}
              </button>
              <button type="button" onClick={cancelForm} className="btn-secondary" disabled={isCreating}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '16px'
        }}>
          Loading campaigns...
        </div>
      ) : metrics.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '16px'
        }}>
          No campaigns found. {filterCampaign && 'Try adjusting your filter.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Impressions</th>
                <th style={{ textAlign: 'right' }}>Clicks</th>
                <th style={{ textAlign: 'right' }}>Conversions</th>
                <th style={{ textAlign: 'right' }}>CTR</th>
                <th style={{ textAlign: 'right' }}>Conv. Rate</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => {
                const ctr = metric.impressions > 0 ? ((metric.clicks / metric.impressions) * 100).toFixed(2) : '0.00';
                const convRate = metric.clicks > 0 ? ((metric.conversions / metric.clicks) * 100).toFixed(2) : '0.00';
                const isOpen = openMediaMetricId === metric.id;
                const media = mediaByMetric[metric.id] || [];
                const isUploading = uploadingForMetricId === metric.id || uploadProgressByMetric[metric.id] !== undefined;
                const progress = uploadProgressByMetric[metric.id] ?? 0;
                
                return (
                  <React.Fragment key={metric.id}>
                    <tr>
                      <td style={{ fontWeight: '600' }}>{metric.campaign_name}</td>
                      <td>{new Date(metric.date).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>{metric.impressions.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>{metric.clicks.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>{metric.conversions.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: '#4ecdc4' }}>{ctr}%</td>
                      <td style={{ textAlign: 'right', color: '#667eea' }}>{convRate}%</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEdit(metric)}
                            className="btn-warning"
                            style={{ marginRight: '8px' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(metric.id)}
                            className="btn-danger"
                            style={{ marginRight: '8px' }}
                          >
                            Delete
                          </button>
                          
                        </div>
                        {isUploading && (
                          <div style={{ marginTop: '8px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #4ecdc4, #667eea)', transition: 'width 120ms ease' }} />
                          </div>
                        )}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={8}>
                          <div className="card" style={{ marginTop: '8px' }}>
                            {media.length === 0 ? (
                              <div style={{ color: 'rgba(255,255,255,0.7)' }}>No media uploaded for this campaign.</div>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                {media.map((m) => {
                                  const urlWithToken = withToken(m.url, token);
                                  return (
                                    <div key={m.url} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px' }}>
                                      {m.mimetype.startsWith('image') ? (
                                        <a href={urlWithToken} target="_blank" rel="noreferrer">
                                          <img src={urlWithToken} alt={m.filename} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                                        </a>
                                      ) : (
                                        <video controls style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}>
                                          <source src={urlWithToken} />
                                        </video>
                                      )}
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                      <a href={`/reel/${m.id}`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>Open</a>
                                      <div>
                                          <button onClick={() => copyShare(urlWithToken)} className="btn-primary" style={{ padding: '6px 10px', fontSize: '12px', marginRight: '8px' }}>Share</button>
                                        </div>
                                        <button onClick={() => setFullscreenMedia(m)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', marginRight: '8px' }}>Fullscreen</button>

                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={onFilesSelected}
        style={{ display: 'none' }}
      />

      {/* Fullscreen overlay */}
      {fullscreenMedia && (
        <div
          ref={fullscreenRef}
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen?.().catch(() => {});
            }
            setFullscreenMedia(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (document.fullscreenElement) {
                  document.exitFullscreen?.().catch(() => {});
                }
                setFullscreenMedia(null);
              }}
              className="btn-danger"
            >
              Close
            </button>
          </div>
          {fullscreenMedia.mimetype.startsWith('image') ? (
            <img
              src={withToken(fullscreenMedia.url, token)}
              alt={fullscreenMedia.filename}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              controls
              autoPlay
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <source src={withToken(fullscreenMedia.url, token)} />
            </video>
          )}
        </div>
      )}
    </div>
  );
};

export default Metrics; 