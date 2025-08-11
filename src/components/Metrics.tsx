import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { metricsAPI } from '../services/api';
import type { Metric, CreateMetricData } from '../types';

const Metrics: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const { logout, user } = useAuth();

  // Form state
  const [formData, setFormData] = useState<CreateMetricData>({
    campaign_name: '',
    date: '',
    impressions: 0,
    clicks: 0,
    conversions: 0
  });

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
    try {
      if (editingMetric) {
        await metricsAPI.updateMetric(editingMetric.id, formData);
      } else {
        await metricsAPI.createMetric(formData);
      }
      setShowAddForm(false);
      setEditingMetric(null);
      resetForm();
      loadMetrics();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save metric');
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
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingMetric(null);
    resetForm();
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

      {/* Stats Cards */}
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
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-primary">
                {editingMetric ? 'Update Campaign' : 'Add Campaign'}
              </button>
              <button type="button" onClick={cancelForm} className="btn-secondary">
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
                
                return (
                  <tr key={metric.id}>
                    <td style={{ fontWeight: '600' }}>{metric.campaign_name}</td>
                    <td>{new Date(metric.date).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>{metric.impressions.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{metric.clicks.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{metric.conversions.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: '#4ecdc4' }}>{ctr}%</td>
                    <td style={{ textAlign: 'right', color: '#667eea' }}>{convRate}%</td>
                    <td style={{ textAlign: 'center' }}>
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
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Metrics; 