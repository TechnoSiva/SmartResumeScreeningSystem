import { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import MetricCard from '../components/ui/MetricCard';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { fetchApi } from '../api/client';
import './Analytics.css';

const CHART_TOOLTIP_STYLE = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '12px',
};

export default function Analytics() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi('job-roles'),
      fetchApi('candidates'),
    ])
      .then(async ([jobsData, candsData]) => {
        const jList = jobsData.job_roles || [];
        setJobs(jList);
        setCandidates(candsData.candidates || []);

        // Fetch results for all jobs
        const resultPromises = jList.map(j => fetchApi(`results/job/${j.id}`).catch(() => ({ results: [] })));
        const allRes = await Promise.all(resultPromises);
        const combined = allRes.flatMap(r => r.results || []);
        setAllResults(combined);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Compute analytics
  const skillDemand = useMemo(() => {
    const counts = {};
    jobs.forEach(j => {
      (j.required_skills || []).forEach(s => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({ name, count }));
  }, [jobs]);

  const missingSkills = useMemo(() => {
    const counts = {};
    allResults.forEach(r => {
      (r.missing_skills || []).forEach(s => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [allResults]);

  const scoreDistribution = useMemo(() => {
    const buckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    allResults.forEach(r => {
      const s = r.overall_score;
      if (s <= 20) buckets['0-20']++;
      else if (s <= 40) buckets['21-40']++;
      else if (s <= 60) buckets['41-60']++;
      else if (s <= 80) buckets['61-80']++;
      else buckets['81-100']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [allResults]);

  const topCandidates = useMemo(() => {
    const bestScores = {};
    allResults.forEach(r => {
      if (!bestScores[r.candidate_name] || r.overall_score > bestScores[r.candidate_name].score) {
        bestScores[r.candidate_name] = {
          name: r.candidate_name,
          score: r.overall_score,
          recommendation: r.recommendation,
          job: r.job_title,
        };
      }
    });
    return Object.values(bestScores).sort((a, b) => b.score - a.score).slice(0, 8);
  }, [allResults]);

  const expScatter = useMemo(() => {
    return allResults.map(r => {
      const cand = candidates.find(c => c.id === r.candidate_id);
      return {
        experience: cand?.experience_years || 0,
        score: r.overall_score,
        name: r.candidate_name,
      };
    });
  }, [allResults, candidates]);

  const avgScore = allResults.length > 0
    ? (allResults.reduce((s, r) => s + r.overall_score, 0) / allResults.length).toFixed(1)
    : 0;
  const strongFitCount = allResults.filter(r => r.recommendation === 'Strong Fit').length;
  const weakFitCount = allResults.filter(r => r.recommendation === 'Weak Fit').length;

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header"><h1>Analytics</h1></div>
        <div className="grid-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  if (allResults.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header"><h1>Analytics</h1><p>Deep insights across all screenings</p></div>
        <EmptyState
          title="No analytics data yet"
          description="Run screenings against job roles to generate analytics insights"
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Deep insights across {allResults.length} screenings and {jobs.length} job roles</p>
      </div>

      {/* Summary Cards */}
      <div className="grid-4">
        <MetricCard icon={<BarChart3 size={22} />} label="Total Screenings" value={allResults.length} color="primary" />
        <MetricCard icon={<TrendingUp size={22} />} label="Avg Score" value={`${avgScore}%`} color="info" />
        <MetricCard icon={<Award size={22} />} label="Strong Fits" value={strongFitCount} color="success" />
        <MetricCard icon={<AlertTriangle size={22} />} label="Weak Fits" value={weakFitCount} color="danger" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2 analytics-row">
        {/* Score Distribution */}
        <div className="card animate-fade-in-up">
          <div className="card__header"><h3>Score Distribution</h3></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={scoreDistribution} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="range" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {scoreDistribution.map((entry, i) => (
                  <Cell key={i} fill={['#ef4444', '#f59e0b', '#f59e0b', '#3b82f6', '#10b981'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill Demand */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="card__header"><h3>Most Demanded Skills</h3></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={skillDemand} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2 analytics-row">
        {/* Missing Skills */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <div className="card__header"><h3>Skill Gaps (Most Missing)</h3></div>
          {missingSkills.length > 0 ? (
            <div className="skill-gap-list">
              {missingSkills.map((s, i) => (
                <div key={i} className="skill-gap-item">
                  <span className="skill-gap-item__name">{s.name}</span>
                  <div className="skill-gap-item__bar-track">
                    <div
                      className="skill-gap-item__bar-fill"
                      style={{
                        width: `${(s.count / Math.max(missingSkills[0]?.count, 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="skill-gap-item__count">{s.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No skill gaps found" />
          )}
        </div>

        {/* Top Candidates */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <div className="card__header"><h3>Top Candidates Leaderboard</h3></div>
          <div className="leaderboard">
            {topCandidates.map((c, i) => (
              <div key={i} className="leaderboard-item">
                <span className="leaderboard-item__rank">#{i + 1}</span>
                <div className="leaderboard-item__avatar">{c.name?.charAt(0)}</div>
                <div className="leaderboard-item__info">
                  <span className="leaderboard-item__name">{c.name}</span>
                  <span className="leaderboard-item__job">{c.job}</span>
                </div>
                <span className="leaderboard-item__score">{c.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Experience vs Score */}
      {expScatter.length > 0 && (
        <div className="card animate-fade-in-up analytics-row" style={{ animationDelay: '200ms' }}>
          <div className="card__header"><h3>Experience vs. Score Correlation</h3></div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="experience" name="Experience (yrs)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} label={{ value: 'Experience (years)', position: 'bottom', fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis dataKey="score" name="Score" domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 12 }} />
              <ZAxis range={[50, 200]} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value, name) => [name === 'experience' ? `${value} yrs` : `${value}%`, name === 'experience' ? 'Experience' : 'Score']} />
              <Scatter data={expScatter} fill="#6366f1" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
