import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const categories = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'magang', label: 'Magang' },
  { id: 'full_time', label: 'Full Time' },
  { id: 'part_time', label: 'Part Time' },
  { id: 'beasiswa', label: 'Beasiswa' },
];

const CareerPage = () => {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'magang',
    company_or_institution: '',
    description: '',
    registration_link: '',
  });

  const toast = useToast();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/career-posts');
      const data = res.data?.data || res.data || [];
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching career posts:', err);
      toast.error('Gagal mengambil daftar lowongan karir.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/career-posts', formData);
      toast.success('Lowongan berhasil dikirim! Menunggu persetujuan Guru BK.');
      setModalOpen(false);
      setFormData({
        title: '',
        category: 'magang',
        company_or_institution: '',
        description: '',
        registration_link: '',
      });
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim info lowongan.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch =
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.company_or_institution?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Informasi Karir, Magang & Beasiswa
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Peluang karir terverifikasi dan beasiswa eksklusif untuk jaringan alumni SMAN 1 Talang Padang
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary"
          >
            ➕ Pasang Info Karir / Beasiswa
          </button>
        </div>

        {/* Filters and search */}
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="filter-tabs" style={{ marginBottom: 0 }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`filter-tab ${selectedCategory === cat.id ? 'active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Cari posisi, instansi, atau kata kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: '400px' }}
            />
          </div>
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <Spinner text="Memuat lowongan & peluang..." />
      ) : filteredPosts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💼</div>
          <h3 style={{ color: '#cbd5e1', fontSize: '1.1rem', fontWeight: 700 }}>
            Tidak ada lowongan ditemukan
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Coba ubah kata kunci pencarian atau kategori yang dipilih.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <Badge variant={post.category}>{post.category}</Badge>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {post.created_at ? new Date(post.created_at).toLocaleDateString('id-ID') : ''}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9', margin: '0.25rem 0 0.5rem' }}>
                  {post.title}
                </h3>

                <div style={{ fontSize: '0.875rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.75rem' }}>
                  🏢 {post.company_or_institution}
                </div>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                    maxHeight: '120px',
                    overflowY: 'auto',
                  }}
                >
                  {post.description}
                </p>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Oleh: {post.author?.name || 'Alumni / BK'}
                </span>

                {post.registration_link && (
                  <a
                    href={post.registration_link.startsWith('http') ? post.registration_link : `https://${post.registration_link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    Buka Tautan ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Submit Career Post */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Pasang Info Karir / Peluang Baru"
        maxWidth="600px"
      >
        <form onSubmit={handleCreatePost}>
          <div className="form-group">
            <label className="form-label">Judul Posisi / Peluang *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="Contoh: Frontend Developer Internship / Beasiswa Unggulan"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kategori *</label>
              <select
                name="category"
                className="form-input form-select"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="magang">Magang (Internship)</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="beasiswa">Beasiswa</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Perusahaan / Institusi *</label>
              <input
                type="text"
                name="company_or_institution"
                className="form-input"
                placeholder="Contoh: PT Telkom / Kemendikbud"
                value={formData.company_or_institution}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi & Kualifikasi *</label>
            <textarea
              name="description"
              rows={4}
              className="form-input form-textarea"
              placeholder="Tuliskan syarat kualifikasi, deskripsi pekerjaan, kontak HR, dll..."
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Link Registrasi / Pendaftaran (URL)</label>
            <input
              type="text"
              name="registration_link"
              className="form-input"
              placeholder="https://..."
              value={formData.registration_link}
              onChange={handleInputChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Mengirim...' : 'Kirim untuk Verifikasi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CareerPage;
