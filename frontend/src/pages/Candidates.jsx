import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Trash2, Mail, Phone, GraduationCap, Clock, Upload, Grid3X3, List } from 'lucide-react';
import { SkillTagList } from '../components/ui/SkillTag';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import ScoreRing from '../components/ui/ScoreRing';
import { fetchApi, deleteApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import './Candidates.css';

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eduFilter, setEduFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const addToast = useToast();

  const loadCandidates = () => {
    setLoading(true);
    fetchApi('candidates')
      .then(data => setCandidates(data.candidates || []))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCandidates(); }, []);

  const filtered = useMemo(() => {
    let result = candidates;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        (c.skills || []).some(s => s.toLowerCase().includes(q))
      );
    }
    if (eduFilter) {
      result = result.filter(c => c.education_level === eduFilter);
    }
    return result;
  }, [candidates, search, eduFilter]);

  const eduLevels = [...new Set(candidates.map(c => c.education_level).filter(Boolean))];

  const handleDelete = async (id, name) => {
    try {
      await deleteApi(`candidates/${id}`);
      addToast(`Deleted ${name}`, 'success');
      loadCandidates();
      setSelectedCandidate(null);
    } catch (e) {
      addToast('Failed to delete candidate', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header"><h1>Candidates</h1></div>
        <div className="grid-3">{[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Candidates</h1>
        <p>{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} in database</p>
      </div>

      {/* Toolbar */}
      <div className="candidates-toolbar">
        <div className="search-box">
          <Search size={16} className="search-box__icon" />
          <input
            type="text"
            placeholder="Search by name or skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-box__input"
          />
        </div>
        <div className="toolbar-actions">
          <select
            className="form-select toolbar-select"
            value={eduFilter}
            onChange={e => setEduFilter(e.target.value)}
          >
            <option value="">All Education</option>
            {eduLevels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <div className="view-toggle">
            <button
              className={`view-toggle__btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              className={`view-toggle__btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="results-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Upload size={48} />}
          title={candidates.length === 0 ? "No candidates yet" : "No matching candidates"}
          description={candidates.length === 0 ? "Upload resumes to build your candidate database" : "Try adjusting your search or filters"}
          action={candidates.length === 0 ? <Link to="/upload" className="btn btn-primary">Upload Resumes</Link> : null}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid-3 candidates-grid">
          {filtered.map((c, i) => (
            <div
              key={c.id}
              className="candidate-card card"
              onClick={() => setSelectedCandidate(c)}
              style={{ animationDelay: `${i * 40}ms`, cursor: 'pointer' }}
            >
              <div className="candidate-card__top">
                <div className="candidate-card__avatar">{c.name?.charAt(0) || '?'}</div>
                <div className="candidate-card__info">
                  <h4 className="candidate-card__name">{c.name}</h4>
                  <span className="candidate-card__meta">{c.experience_years} yrs experience</span>
                </div>
              </div>
              <div className="candidate-card__edu">
                <Badge label={c.education_level || 'Unknown'} variant="default" size="sm" />
              </div>
              <div className="candidate-card__skills">
                <SkillTagList skills={c.skills || []} max={5} />
              </div>
              {c.email && (
                <div className="candidate-card__contact">
                  <Mail size={12} /> <span>{c.email}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Experience</th>
                  <th>Education</th>
                  <th>Skills</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="clickable-row" onClick={() => setSelectedCandidate(c)}>
                    <td>
                      <div className="table-user">
                        <div className="table-user__avatar">{c.name?.charAt(0)}</div>
                        <span className="table-user__name">{c.name}</span>
                      </div>
                    </td>
                    <td className="text-muted text-sm">{c.email || 'N/A'}</td>
                    <td><span className="mono-text">{c.experience_years} yrs</span></td>
                    <td><Badge label={c.education_level || 'Unknown'} variant="default" size="sm" /></td>
                    <td><SkillTagList skills={c.skills || []} max={3} /></td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={e => { e.stopPropagation(); handleDelete(c.id, c.name); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title="Candidate Profile"
        size="lg"
      >
        {selectedCandidate && <CandidateDetail candidate={selectedCandidate} onDelete={handleDelete} />}
      </Modal>
    </div>
  );
}

function CandidateDetail({ candidate: c, onDelete }) {
  return (
    <div className="candidate-detail">
      <div className="candidate-detail__header">
        <div className="candidate-detail__avatar">{c.name?.charAt(0)}</div>
        <div>
          <h2>{c.name}</h2>
          <div className="candidate-detail__contacts">
            {c.email && <span><Mail size={14} /> {c.email}</span>}
            {c.phone && <span><Phone size={14} /> {c.phone}</span>}
          </div>
        </div>
      </div>

      <div className="candidate-detail__stats">
        <div className="detail-stat">
          <GraduationCap size={16} />
          <span>{c.education_level || 'Unknown'}</span>
        </div>
        <div className="detail-stat">
          <Clock size={16} />
          <span>{c.experience_years} years experience</span>
        </div>
      </div>

      <div className="candidate-detail__section">
        <h4>Skills ({(c.skills || []).length})</h4>
        <SkillTagList skills={c.skills || []} max={30} />
      </div>

      {c.skills_categorized && Object.keys(c.skills_categorized).length > 0 && (
        <div className="candidate-detail__section">
          <h4>Skills by Category</h4>
          {Object.entries(c.skills_categorized).map(([cat, skills]) => (
            skills && skills.length > 0 && (
              <div key={cat} className="skill-category">
                <span className="skill-category__label">{cat.replace('_', ' ')}</span>
                <SkillTagList skills={skills} max={15} />
              </div>
            )
          ))}
        </div>
      )}

      <div className="candidate-detail__actions">
        <button className="btn btn-danger" onClick={() => onDelete(c.id, c.name)}>
          <Trash2 size={16} /> Delete Candidate
        </button>
      </div>
    </div>
  );
}
