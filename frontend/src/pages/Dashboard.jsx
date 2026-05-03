import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, Target, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import MetricCard from '../components/ui/MetricCard';
import Badge from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { fetchApi } from '../api/client';
import './Dashboard.css';

const COLORS = {
  'Strong Fit': '#10b981',
  'Good Fit': '#3b82f6',
  'Moderate Fit': '#f59e0b',
  'Weak Fit': '#ef4444',
};

const FUNNEL_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchApi('dashboard/stats'),
      fetchApi('candidates'),
    ])
      .then(([statsData, candsData]) => {
        setStats(statsData);
        setCandidates(candsData.candidates || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="page-container">
        <EmptyState
          title="Cannot connect to backend"
          description="Make sure FastAPI is running on port 8000. Run: uvicorn api.main:app --reload"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header"><h1>Dashboard</h1></div>
        <div className="grid-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const recData = Object.entries(stats.recommendation_breakdown || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const funnelData = [
    { name: 'Total Candidates', value: stats.total_candidates },
    { name: 'Screenings Run', value: stats.total_screenings },
    { name: 'Good+ Fit', value: (stats.recommendation_breakdown?.['Strong Fit'] || 0) + (stats.recommendation_breakdown?.['Good Fit'] || 0) },
    { name: 'Strong Fit', value: stats.recommendation_breakdown?.['Strong Fit'] || 0 },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back — here's your recruitment overview</p>
      </div>

      {/* KPI Metrics */}
      <div className="grid-4">
        <MetricCard
          icon={<Users size={22} />}
          label="Total Candidates"
          value={stats.total_candidates}
          subtitle="In database"
          color="primary"
          delay={0}
        />
        <MetricCard
          icon={<Briefcase size={22} />}
          label="Active Job Roles"
          value={stats.total_jobs}
          subtitle="Open positions"
          color="info"
          delay={80}
        />
        <MetricCard
          icon={<Target size={22} />}
          label="Screenings Run"
          value={stats.total_screenings}
          subtitle="Total evaluations"
          color="warning"
          delay={160}
        />
        <MetricCard
          icon={<TrendingUp size={22} />}
          label="Average Score"
          value={`${stats.avg_score}%`}
          subtitle="Across all screenings"
          color="success"
          delay={240}
        />
      </div>

      {/* Charts Row */}
      <div className="dashboard__charts grid-2">
        {/* Hiring Funnel */}
        <div className="card animate-fade-in-up">
          <div className="card__header">
            <h3>Hiring Pipeline</h3>
          </div>
          {funnelData[0].value > 0 ? (
            <div className="funnel-chart">
              {funnelData.map((item, i) => {
                const maxVal = Math.max(funnelData[0].value, 1);
                const width = Math.max(25, (item.value / maxVal) * 100);
                return (
                  <div key={i} className="funnel-bar" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="funnel-bar__label">
                      <span>{item.name}</span>
                      <span className="funnel-bar__count">{item.value}</span>
                    </div>
                    <div className="funnel-bar__track">
                      <div
                        className="funnel-bar__fill"
                        style={{
                          width: `${width}%`,
                          background: FUNNEL_COLORS[i],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No data yet" description="Upload resumes and run screenings to see the pipeline" />
          )}
        </div>

        {/* Recommendation Donut */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="card__header">
            <h3>Recommendation Breakdown</h3>
          </div>
          {recData.length > 0 ? (
            <div className="donut-container">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={recData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {recData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-legend">
                {recData.map((entry, i) => (
                  <div key={i} className="donut-legend__item">
                    <span className="donut-legend__dot" style={{ background: COLORS[entry.name] || '#64748b' }} />
                    <span className="donut-legend__label">{entry.name}</span>
                    <span className="donut-legend__value">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="No screenings yet" description="Run a screening to see recommendation breakdown" />
          )}
        </div>
      </div>

      {/* Recent Candidates Table */}
      <div className="card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="card__header flex-between">
          <h3>Recent Candidates</h3>
          <Link to="/candidates" className="btn btn-ghost btn-sm">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {candidates.length > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Experience</th>
                  <th>Education</th>
                  <th>Skills</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {candidates.slice(0, 6).map((c, i) => (
                  <tr key={c.id} style={{ animationDelay: `${i * 50}ms` }}>
                    <td>
                      <div className="table-user">
                        <div className="table-user__avatar">
                          {c.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="table-user__name">{c.name}</div>
                          <div className="table-user__email">{c.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="mono-text">{c.experience_years} yrs</span></td>
                    <td><Badge label={c.education_level || 'Unknown'} variant="default" size="sm" /></td>
                    <td>
                      <div className="skill-preview">
                        {(c.skills || []).slice(0, 3).map((s, j) => (
                          <span key={j} className="skill-mini">{s}</span>
                        ))}
                        {(c.skills?.length || 0) > 3 && (
                          <span className="skill-mini skill-mini--more">+{c.skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-muted text-sm">
                        <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No candidates yet" description="Upload resumes to get started" />
        )}
      </div>
    </div>
  );
}
