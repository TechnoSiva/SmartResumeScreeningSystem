import { useState, useEffect } from 'react';
import { Rocket, Loader, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import ScoreRing from '../components/ui/ScoreRing';
import Badge from '../components/ui/Badge';
import { SkillTagList } from '../components/ui/SkillTag';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { fetchApi, postApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import './Screening.css';

export default function Screening() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screening, setScreening] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filterRec, setFilterRec] = useState('');
  const [compareIds, setCompareIds] = useState([]);
  const addToast = useToast();

  useEffect(() => {
    fetchApi('job-roles')
      .then(data => {
        const j = data.job_roles || [];
        setJobs(j);
        if (j.length > 0) setSelectedJobId(String(j[0].id));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      setResultsLoading(true);
      fetchApi(`results/job/${selectedJobId}`)
        .then(data => setResults(data.results || []))
        .catch(() => setResults([]))
        .finally(() => setResultsLoading(false));
    }
  }, [selectedJobId]);

  const handleScreen = async () => {
    setScreening(true);
    try {
      const res = await postApi(`screen-bulk/${selectedJobId}`);
      addToast(`Screened ${res.count} candidates successfully!`, 'success');
      // Reload results
      const data = await fetchApi(`results/job/${selectedJobId}`);
      setResults(data.results || []);
    } catch (e) {
      addToast('Screening failed: ' + e.message, 'error');
    } finally {
      setScreening(false);
    }
  };

  const filteredResults = filterRec
    ? results.filter(r => r.recommendation === filterRec)
    : results;

  const toggleCompare = (id) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const compareData = compareIds.length >= 2
    ? compareIds.map(id => results.find(r => r.candidate_id === id)).filter(Boolean)
    : [];

  const selectedJob = jobs.find(j => String(j.id) === selectedJobId);

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header"><h1>Screen & Match</h1></div>
        <SkeletonCard />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header"><h1>Screen & Match</h1></div>
        <EmptyState title="No job roles available" description="Create a job role first, then come back to screen candidates against it." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Screen & Match</h1>
        <p>Run the NLP scoring engine to rank candidates against job requirements</p>
      </div>

      {/* Controls */}
      <div className="screening-controls card">
        <div className="screening-controls__row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Target Job Role</label>
            <select
              className="form-select"
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title} — {j.department || 'General'}</option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleScreen}
            disabled={screening}
          >
            {screening ? (
              <><Loader size={18} className="spin" /> Screening...</>
            ) : (
              <><Rocket size={18} /> Screen All Candidates</>
            )}
          </button>
        </div>
        {selectedJob && (
          <div className="screening-job-preview">
            <span><strong>Required:</strong> {(selectedJob.required_skills || []).join(', ') || 'None'}</span>
            <span><strong>Min Exp:</strong> {selectedJob.min_experience} yrs</span>
            <span><strong>Education:</strong> {selectedJob.min_education || 'Any'}</span>
          </div>
        )}
      </div>

      {/* Comparison Panel */}
      {compareData.length >= 2 && (
        <div className="card animate-fade-in" style={{ marginTop: 'var(--space-6)' }}>
          <div className="card__header">
            <h3>Candidate Comparison</h3>
          </div>
          <div className="comparison-panel">
            <div className="comparison-chart">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  { metric: 'Skills', ...Object.fromEntries(compareData.map((c, i) => [`c${i}`, c.skill_score])) },
                  { metric: 'Experience', ...Object.fromEntries(compareData.map((c, i) => [`c${i}`, c.experience_score])) },
                  { metric: 'Education', ...Object.fromEntries(compareData.map((c, i) => [`c${i}`, c.education_score])) },
                  { metric: 'Keywords', ...Object.fromEntries(compareData.map((c, i) => [`c${i}`, c.keyword_score])) },
                  { metric: 'Overall', ...Object.fromEntries(compareData.map((c, i) => [`c${i}`, c.overall_score])) },
                ]}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  {compareData.map((c, i) => (
                    <Radar
                      key={i}
                      name={c.candidate_name}
                      dataKey={`c${i}`}
                      stroke={['#6366f1', '#10b981', '#f59e0b'][i]}
                      fill={['#6366f1', '#10b981', '#f59e0b'][i]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="comparison-legend">
              {compareData.map((c, i) => (
                <div key={i} className="comparison-legend__item">
                  <span className="comparison-legend__dot" style={{ background: ['#6366f1', '#10b981', '#f59e0b'][i] }} />
                  <span>{c.candidate_name}</span>
                  <span className="mono-text">{c.overall_score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {resultsLoading ? (
        <div style={{ marginTop: 'var(--space-6)' }}>
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : results.length > 0 ? (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <div className="results-header">
            <h3>Ranked Candidates ({filteredResults.length})</h3>
            <div className="results-filters">
              <select className="form-select toolbar-select" value={filterRec} onChange={e => setFilterRec(e.target.value)}>
                <option value="">All Recommendations</option>
                <option>Strong Fit</option>
                <option>Good Fit</option>
                <option>Moderate Fit</option>
                <option>Weak Fit</option>
              </select>
              {compareIds.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setCompareIds([])}>Clear Compare</button>
              )}
            </div>
          </div>

          <div className="results-list-screening">
            {filteredResults.map((r, i) => (
              <div key={r.id} className="result-row card" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="result-row__main" onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}>
                  <div className="result-row__rank">#{i + 1}</div>
                  <div className="result-row__avatar">{r.candidate_name?.charAt(0)}</div>
                  <div className="result-row__info">
                    <span className="result-row__name">{r.candidate_name}</span>
                    <Badge label={r.recommendation} />
                  </div>
                  <div className="result-row__score">
                    <ScoreRing score={r.overall_score} size={56} strokeWidth={5} />
                  </div>
                  <div className="result-row__actions">
                    <label className="compare-checkbox" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={compareIds.includes(r.candidate_id)}
                        onChange={() => toggleCompare(r.candidate_id)}
                      />
                      <span>Compare</span>
                    </label>
                    {expandedRow === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {expandedRow === r.id && (
                  <div className="result-row__detail animate-fade-in">
                    <div className="score-breakdown">
                      <ScoreRing score={r.skill_score} size={64} strokeWidth={5} label="Skills" />
                      <ScoreRing score={r.experience_score} size={64} strokeWidth={5} label="Exp" />
                      <ScoreRing score={r.education_score} size={64} strokeWidth={5} label="Edu" />
                      <ScoreRing score={r.keyword_score} size={64} strokeWidth={5} label="Keywords" />
                    </div>
                    {(r.matched_skills || []).length > 0 && (
                      <div className="skill-section">
                        <span className="skill-section__label">✓ Matched Skills</span>
                        <SkillTagList skills={r.matched_skills} variant="success" max={20} />
                      </div>
                    )}
                    {(r.missing_skills || []).length > 0 && (
                      <div className="skill-section">
                        <span className="skill-section__label">✗ Missing Skills</span>
                        <SkillTagList skills={r.missing_skills} variant="danger" max={20} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <EmptyState title="No screening results yet" description="Click 'Screen All Candidates' to run the matching engine" />
        </div>
      )}
    </div>
  );
}
