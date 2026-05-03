import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Clock, GraduationCap, Briefcase } from 'lucide-react';
import { SkillTagList } from '../components/ui/SkillTag';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { SkeletonCard } from '../components/ui/Skeleton';
import { fetchApi, postApi, deleteApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import './JobRoles.css';

export default function JobRoles() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const addToast = useToast();

  const loadJobs = () => {
    setLoading(true);
    fetchApi('job-roles')
      .then(data => setJobs(data.job_roles || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadJobs(); }, []);

  const handleDelete = async (id, title) => {
    try {
      await deleteApi(`job-roles/${id}`);
      addToast(`Deleted "${title}"`, 'success');
      loadJobs();
    } catch (e) {
      addToast('Failed to delete job role', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header"><h1>Job Roles</h1></div>
        <div className="grid-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Job Roles</h1>
          <p>{jobs.length} active position{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Job Role
        </button>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={48} />}
          title="No job roles yet"
          description="Create your first job role to start screening candidates"
          action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Create Job Role</button>}
        />
      ) : (
        <div className="grid-3 jobs-grid">
          {jobs.map((job, i) => (
            <div key={job.id} className="job-card card" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="job-card__header">
                <div className="job-card__icon">
                  <Briefcase size={20} />
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(job.id, job.title)}
                  title="Delete job role"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="job-card__title">{job.title}</h3>
              {job.department && (
                <Badge label={job.department} variant="primary" size="sm" />
              )}
              <div className="job-card__stats">
                <span><Clock size={14} /> {job.min_experience} yrs min</span>
                <span><GraduationCap size={14} /> {job.min_education || 'Any'}</span>
              </div>
              <div className="job-card__section">
                <span className="job-card__label">Required Skills</span>
                <SkillTagList skills={job.required_skills || []} max={5} />
              </div>
              {(job.preferred_skills || []).length > 0 && (
                <div className="job-card__section">
                  <span className="job-card__label">Preferred</span>
                  <SkillTagList skills={job.preferred_skills} max={3} variant="default" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Job Role" size="lg">
        <CreateJobForm
          onSuccess={() => {
            setShowCreate(false);
            loadJobs();
            addToast('Job role created successfully!', 'success');
          }}
        />
      </Modal>
    </div>
  );
}

function CreateJobForm({ onSuccess }) {
  const [form, setForm] = useState({
    title: '', department: '', description: '',
    required_skills: '', preferred_skills: '',
    min_experience: 0, min_education: "Bachelor's Degree",
  });
  const [submitting, setSubmitting] = useState(false);
  const addToast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      addToast('Title and description are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await postApi('job-roles', {
        ...form,
        required_skills: form.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        preferred_skills: form.preferred_skills.split(',').map(s => s.trim()).filter(Boolean),
        min_experience: parseFloat(form.min_experience) || 0,
      });
      onSuccess();
    } catch (e) {
      addToast('Failed to create job role', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="create-job-form">
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Job Title *</label>
          <input className="form-input" value={form.title} onChange={update('title')} placeholder="e.g. Senior Software Engineer" />
        </div>
        <div className="form-group">
          <label className="form-label">Department</label>
          <input className="form-input" value={form.department} onChange={update('department')} placeholder="e.g. Engineering" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Job Description *</label>
        <textarea className="form-textarea" value={form.description} onChange={update('description')} placeholder="Describe the role, responsibilities, and requirements..." />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Required Skills (comma separated) *</label>
          <input className="form-input" value={form.required_skills} onChange={update('required_skills')} placeholder="Python, FastAPI, SQL" />
        </div>
        <div className="form-group">
          <label className="form-label">Preferred Skills (comma separated)</label>
          <input className="form-input" value={form.preferred_skills} onChange={update('preferred_skills')} placeholder="Docker, AWS" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Minimum Experience (Years)</label>
          <input type="number" className="form-input" value={form.min_experience} onChange={update('min_experience')} min="0" step="0.5" />
        </div>
        <div className="form-group">
          <label className="form-label">Minimum Education</label>
          <select className="form-select" value={form.min_education} onChange={update('min_education')}>
            <option>High School / GED</option>
            <option>Diploma / Certificate</option>
            <option>Associate's Degree</option>
            <option>Bachelor's Degree</option>
            <option>Master's Degree</option>
            <option>PhD / Doctorate</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Job Role'}
        </button>
      </div>
    </form>
  );
}
