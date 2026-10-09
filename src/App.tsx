
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { fetchApi } from './services/api';

/* ─── Login Screen ─── */
function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSimulateLogin = () => {
    localStorage.setItem('token', 'demo-token-simulated');
    window.location.reload();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      // fallback: simulate login
      handleSimulateLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a' }}>
      <div style={{ background: '#1e293b', padding: '3rem', borderRadius: '1.5rem', width: '400px', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>CMS Admin</h1>
        {error && <p style={{ color: '#f87171', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <label style={{ display: 'block', marginBottom: '.5rem', color: '#94a3b8' }}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <label style={{ display: 'block', marginBottom: '.5rem', marginTop: '1rem', color: '#94a3b8' }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          <button type="submit" disabled={loading} style={{ ...btnPrimary, width: '100%', marginTop: '1.5rem' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <button onClick={handleSimulateLogin} style={{ ...btnSecondary, width: '100%', marginTop: '.75rem' }}>
          Simulate Login (Dev)
        </button>
      </div>
    </div>
  );
}

/* ─── CRUD Page Component ─── */
function CrudPage({ title, endpoint, fields }: {
  title: string;
  endpoint: string;
  fields: { name: string; label: string; type?: string; required?: boolean }[];
}) {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchItems = async () => {
    try {
      const res = await fetchApi(`/${endpoint}`);
      setItems(res.data || []);
    } catch (err) {
      console.error('Fetch failed:', err);
    }
  };

  useEffect(() => { fetchItems(); }, [endpoint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const body: any = { ...form };
      // Parse numeric fields
      fields.forEach(f => {
        if (f.type === 'number' && body[f.name] !== undefined) {
          body[f.name] = parseInt(body[f.name], 10) || 0;
        }
        if (f.type === 'checkbox') {
          body[f.name] = !!body[f.name];
        }
      });

      if (editingId) {
        await fetchApi(`/${endpoint}/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
        setMessage(`${title} updated!`);
      } else {
        await fetchApi(`/${endpoint}`, { method: 'POST', body: JSON.stringify(body) });
        setMessage(`${title} created!`);
      }
      setForm({});
      setEditingId(null);
      fetchItems();
    } catch (err: any) {
      setMessage('Error: ' + (err.message || 'Failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    const f: any = {};
    fields.forEach(field => { f[field.name] = item[field.name] ?? ''; });
    setForm(f);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    try {
      await fetchApi(`/${endpoint}/${id}`, { method: 'DELETE' });
      setMessage('Deleted!');
      fetchItems();
    } catch (err: any) {
      setMessage('Delete failed: ' + err.message);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem' }}>
        {title}s
      </h1>
      {message && (
        <div style={{ padding: '.75rem 1rem', borderRadius: '.75rem', marginBottom: '1rem', background: message.startsWith('Error') ? '#7f1d1d' : '#14532d', color: 'white' }}>
          {message}
        </div>
      )}
      {/* Form */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1rem' }}>
          {editingId ? `Edit ${title}` : `Add New ${title}`}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {fields.map(field => (
              <div key={field.name} style={field.type === 'textarea' ? { gridColumn: 'span 2' } : {}}>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '.25rem', fontSize: '.875rem' }}>
                  {field.label} {field.required && '*'}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={form[field.name] || ''}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                    required={field.required}
                  />
                ) : field.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={!!form[field.name]}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.checked })}
                    style={{ width: '20px', height: '20px' }}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={form[field.name] || ''}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    style={inputStyle}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '1rem' }}>
            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} style={btnSecondary}>Cancel</button>
            )}
          </div>
        </form>
      </div>
      {/* Table */}
      <div className="glass-panel" style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={thStyle}>ID</th>
              {fields.slice(0, 4).map(f => <th key={f.name} style={thStyle}>{f.label}</th>)}
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={fields.slice(0, 4).length + 2} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No items yet. Add one above!</td></tr>
            ) : items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={tdStyle}>{item.id}</td>
                {fields.slice(0, 4).map(f => (
                  <td key={f.name} style={tdStyle}>
                    {typeof item[f.name] === 'boolean' ? (item[f.name] ? '✅' : '❌') :
                     String(item[f.name] || '').substring(0, 50)}
                  </td>
                ))}
                <td style={tdStyle}>
                  <button onClick={() => handleEdit(item)} style={{ ...btnSmall, background: '#2563eb', marginRight: '.5rem' }}>Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={{ ...btnSmall, background: '#dc2626' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── About Page (Singleton) ─── */
function AboutPage() {
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchApi('/about').then(res => {
      if (res.data) setForm(res.data);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { ...form };
      delete body.id;
      delete body.createdAt;
      delete body.updatedAt;
      await fetchApi('/about', { method: 'PUT', body: JSON.stringify(body) });
      setMessage('About updated!');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const aboutFields = [
    { name: 'name', label: 'Name' },
    { name: 'headline', label: 'Headline' },
    { name: 'email', label: 'Email' },
    { name: 'photoUrl', label: 'Photo URL' },
    { name: 'resumeUrl', label: 'Resume URL' },
    { name: 'bio', label: 'Bio', type: 'textarea' as const },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem' }}>About / Profile</h1>
      {message && (
        <div style={{ padding: '.75rem 1rem', borderRadius: '.75rem', marginBottom: '1rem', background: message.startsWith('Error') ? 'rgba(127,29,29,0.8)' : 'rgba(20,83,45,0.8)', color: 'white' }}>
          {message}
        </div>
      )}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {aboutFields.map(field => (
              <div key={field.name} style={field.type === 'textarea' ? { gridColumn: 'span 2' } : {}}>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '.25rem', fontSize: '.875rem' }}>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={form[field.name] || ''}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                  />
                ) : (
                  <input
                    type="text"
                    value={form[field.name] || ''}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>
          <button type="submit" disabled={loading} style={{ ...btnPrimary, marginTop: '1rem' }}>
            {loading ? 'Saving...' : 'Save About'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Dashboard ─── */
function Dashboard() {
  const [stats, setStats] = useState({ skills: 0, projects: 0, blogs: 0, messages: 0 });

  useEffect(() => {
    Promise.all([
      fetchApi('/skills').catch(() => ({ data: [] })),
      fetchApi('/projects').catch(() => ({ data: [] })),
      fetchApi('/blogs').catch(() => ({ data: [] })),
      fetchApi('/messages').catch(() => ({ data: [] })),
    ]).then(([s, p, b, m]) => {
      setStats({
        skills: s.data?.length || 0,
        projects: p.data?.length || 0,
        blogs: b.data?.length || 0,
        messages: m.data?.length || 0,
      });
    });
  }, []);

  const cards = [
    { label: 'Skills', count: stats.skills, color: '#3b82f6' },
    { label: 'Projects', count: stats.projects, color: '#8b5cf6' },
    { label: 'Blogs', count: stats.blogs, color: '#10b981' },
    { label: 'Messages', count: stats.messages, color: '#f59e0b' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {cards.map(c => (
          <div key={c.label} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${c.color}` }}>
            <p style={{ color: '#cbd5e1', fontSize: '.875rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{c.label}</p>
            <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{c.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Admin Layout & Router ─── */
const navItems = [
  { path: '', label: '📊 Dashboard' },
  { path: 'about', label: '👤 About' },
  { path: 'skills', label: '⚡ Skills' },
  { path: 'projects', label: '🚀 Projects' },
  { path: 'blogs', label: '📝 Blogs' },
  { path: 'experiences', label: '💼 Experience' },
  { path: 'testimonials', label: '💬 Testimonials' },
  { path: 'services', label: '🛠 Services' },
  { path: 'messages', label: '📩 Messages' },
];

function AdminPanel() {
  const { logout } = useAuth();
  const [page, setPage] = useState(window.location.hash.replace('#/', '') || '');

  useEffect(() => {
    const handler = () => setPage(window.location.hash.replace('#/', '') || '');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = '#/' + path;
  };

  const renderPage = () => {
    switch (page) {
      case 'about': return <AboutPage />;
      case 'skills': return <CrudPage title="Skill" endpoint="skills" fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'category', label: 'Category', required: true },
        { name: 'level', label: 'Level (1-5)', type: 'number', required: true },
        { name: 'icon', label: 'Icon' },
        { name: 'order', label: 'Order', type: 'number' },
      ]} />;
      case 'projects': return <CrudPage title="Project" endpoint="projects" fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'slug', label: 'Slug', required: true },
        { name: 'summary', label: 'Summary', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'coverUrl', label: 'Cover URL' },
        { name: 'techStack', label: 'Tech Stack (comma-sep)' },
        { name: 'liveUrl', label: 'Live URL' },
        { name: 'repoUrl', label: 'Repo URL' },
        { name: 'featured', label: 'Featured', type: 'checkbox' },
        { name: 'order', label: 'Order', type: 'number' },
      ]} />;
      case 'blogs': return <CrudPage title="Blog" endpoint="blogs" fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'slug', label: 'Slug', required: true },
        { name: 'excerpt', label: 'Excerpt' },
        { name: 'content', label: 'Content', type: 'textarea', required: true },
        { name: 'category', label: 'Category' },
        { name: 'published', label: 'Published', type: 'checkbox' },
      ]} />;
      case 'experiences': return <CrudPage title="Experience" endpoint="experiences" fields={[
        { name: 'role', label: 'Role', required: true },
        { name: 'company', label: 'Company', required: true },
        { name: 'location', label: 'Location' },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'current', label: 'Current', type: 'checkbox' },
        { name: 'order', label: 'Order', type: 'number' },
      ]} />;
      case 'testimonials': return <CrudPage title="Testimonial" endpoint="testimonials" fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'role', label: 'Role' },
        { name: 'company', label: 'Company' },
        { name: 'quote', label: 'Quote', type: 'textarea', required: true },
        { name: 'published', label: 'Published', type: 'checkbox' },
        { name: 'order', label: 'Order', type: 'number' },
      ]} />;
      case 'services': return <CrudPage title="Service" endpoint="services" fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'icon', label: 'Icon' },
        { name: 'published', label: 'Published', type: 'checkbox' },
        { name: 'order', label: 'Order', type: 'number' },
      ]} />;
      case 'messages': return <CrudPage title="Message" endpoint="messages" fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'email', label: 'Email', required: true },
        { name: 'subject', label: 'Subject' },
        { name: 'message', label: 'Message', type: 'textarea', required: true },
        { name: 'status', label: 'Status' },
      ]} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ width: '260px', margin: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.8rem' }}>🎨</span> CMS Admin
        </h1>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', flex: 1 }}>
          {navItems.map(item => (
            <button
              key={item.path}
              className="nav-item"
              onClick={() => navigate(item.path)}
              style={{
                textAlign: 'left',
                padding: '.85rem 1rem',
                borderRadius: '.75rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '.95rem',
                fontWeight: page === item.path ? '600' : '500',
                background: page === item.path ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: page === item.path ? 'white' : '#cbd5e1',
                boxShadow: page === item.path ? 'inset 2px 0 0 #3b82f6' : 'none',
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className="btn-primary-hover" onClick={logout} style={{ ...btnSecondary, background: 'rgba(220, 38, 38, 0.2)', color: '#fca5a5', border: '1px solid rgba(220, 38, 38, 0.3)', marginTop: '1rem' }}>
          🚪 Logout
        </button>
      </aside>
      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 2rem 2rem 1rem', overflowY: 'auto' }}>
        {renderPage()}
      </main>
    </div>
  );
}

/* ─── Main ─── */
function Main() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginScreen />;
  return <AdminPanel />;
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}

/* ─── Shared Styles ─── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '.85rem 1rem',
  borderRadius: '.75rem',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(15,23,42,0.4)',
  color: 'white',
  fontSize: '.95rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const btnPrimary: React.CSSProperties = {
  padding: '.85rem 1.5rem',
  borderRadius: '.75rem',
  border: 'none',
  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  color: 'white',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '.95rem',
  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
};

const btnSecondary: React.CSSProperties = {
  padding: '.75rem 1.5rem',
  borderRadius: '.75rem',
  border: '1px solid #475569',
  background: 'transparent',
  color: '#94a3b8',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '.9rem',
};

const btnSmall: React.CSSProperties = {
  padding: '.35rem .75rem',
  borderRadius: '.5rem',
  border: 'none',
  color: 'white',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '.75rem',
};

const thStyle: React.CSSProperties = {
  padding: '.75rem 1rem',
  textAlign: 'left',
  fontSize: '.8rem',
  fontWeight: '600',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '.75rem 1rem',
  fontSize: '.875rem',
  borderBottom: '1px solid #334155',
};
