import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const AdminCareerPage = ({ eventOnly = false }) => {
  const categories = eventOnly
    ? ['event_mahasiswa', 'event_umum']
    : ['magang', 'full_time', 'part_time', 'beasiswa'];
  const defaultCategory = eventOnly ? 'event_umum' : 'magang';
  const itemLabel = eventOnly ? 'event' : 'lowongan';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eventImage, setEventImage] = useState(null);
  const [eventImagePreview, setEventImagePreview] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: defaultCategory,
    company_or_institution: '',
    description: '',
    registration_link: '',
    event_phase: 'upcoming',
  });

  const toast = useToast();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const responses = await Promise.all(categories.map((category) => {
        const params = new URLSearchParams({ category });
        if (statusFilter) params.set('status', statusFilter);
        return api.get(`/career-posts?${params.toString()}`);
      }));
      const data = responses.flatMap((response) => response.data?.data || []);
      setPosts(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error(`Error fetching admin ${itemLabel} posts:`, err);
      toast.error(`Gagal mengambil daftar ${itemLabel}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [statusFilter, eventOnly]);

  useEffect(() => {
    if (!eventImage) {
      setEventImagePreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(eventImage);
    setEventImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [eventImage]);

  const handleUpdateStatus = async (postId, newStatus) => {
    try {
      await api.put(`/career-posts/${postId}`, { status: newStatus });
      toast.success(
        newStatus === 'approved'
          ? eventOnly
            ? 'Event berhasil disetujui.'
            : 'Lowongan disetujui & notifikasi WhatsApp masuk antrean.'
          : `Status ${itemLabel} diperbarui.`
      );
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || `Gagal mengubah status ${itemLabel}.`);
    }
  };

  const handleUpdateEventPhase = async (postId, eventPhase) => {
    try {
      await api.put(`/career-posts/${postId}`, { event_phase: eventPhase });
      toast.success('Status event berhasil diperbarui.');
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status event.');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Yakin ingin menghapus postingan ini?')) return;

    try {
      await api.delete(`/career-posts/${postId}`);
      toast.success(`Postingan ${itemLabel} berhasil dihapus.`);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus postingan.');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (eventOnly) {
        const payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
        if (eventImage) payload.append('event_image', eventImage);
        await api.post('/career-posts', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/career-posts', formData);
      }
      toast.success(eventOnly
        ? 'Event resmi sekolah berhasil dipublikasikan.'
        : 'Info lowongan resmi sekolah dibuat. Notifikasi WhatsApp masuk ke antrean.');
      setModalOpen(false);
      setFormData({
        title: '',
        category: defaultCategory,
        company_or_institution: '',
        description: '',
        registration_link: '',
        event_phase: 'upcoming',
      });
      setEventImage(null);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || `Gagal membuat postingan ${itemLabel}.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              {eventOnly ? 'Manajemen Event Sekolah & Alumni' : 'Moderasi Lowongan & Beasiswa'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {eventOnly
                ? 'Buat dan moderasi agenda sekolah, alumni, webinar, dan kegiatan kampus.'
                : 'Verifikasi informasi magang, pekerjaan, dan beasiswa untuk jaringan alumni.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select
              className="form-input form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="">Semua Status</option>
              <option value="pending">Menunggu (Pending)</option>
              <option value="approved">Disetujui (Approved)</option>
              <option value="rejected">Ditolak (Rejected)</option>
            </select>

            <button onClick={() => setModalOpen(true)} className="btn btn-primary">
              ➕ {eventOnly ? 'Buat Event' : 'Buat Info Lowongan'}
            </button>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <Spinner text={`Memuat daftar ${itemLabel}...`} />
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Tidak ada postingan {itemLabel} untuk status yang dipilih.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{eventOnly ? 'Judul Event & Penyelenggara' : 'Judul Posisi & Perusahaan'}</th>
                  <th>Kategori</th>
                  <th>Pengirim</th>
                  <th>Status Moderasi</th>
                  <th style={{ textAlign: 'right' }}>Aksi Moderasi</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      {eventOnly && post.event_image_url && (
                        <img
                          src={post.event_image_url}
                          alt={`Foto ${post.title}`}
                          style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }}
                        />
                      )}
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{post.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#818cf8' }}>
                        🏢 {post.company_or_institution}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          maxWidth: '400px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px',
                        }}
                      >
                        {post.description}
                      </div>
                    </td>
                    <td>
                      <Badge variant={post.category}>{post.category}</Badge>
                      {eventOnly && (
                        <select
                          className="form-input form-select"
                          aria-label={`Status event ${post.title}`}
                          value={post.event_phase || ''}
                          onChange={(event) => handleUpdateEventPhase(post.id, event.target.value)}
                          style={{ marginTop: '0.35rem', minWidth: '150px', fontSize: '0.75rem' }}
                        >
                          <option value="" disabled>Pilih fase</option>
                          <option value="upcoming">Akan datang</option>
                          <option value="completed">Sudah berlangsung</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                        {post.author?.name || 'Admin'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {post.created_at ? new Date(post.created_at).toLocaleDateString('id-ID') : ''}
                      </div>
                    </td>
                    <td>
                      <Badge variant={post.status}>{post.status}</Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {post.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(post.id, 'approved')}
                              className="btn btn-primary btn-sm"
                              title={eventOnly ? 'Setujui event' : 'Setujui dan kirim notifikasi WhatsApp'}
                            >
                              {eventOnly ? '✅ Setujui Event' : '✅ Setujui & Push WA'}
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(post.id, 'rejected')}
                              className="btn btn-secondary btn-sm"
                              title="Tolak postingan"
                            >
                              ❌ Tolak
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="btn btn-danger btn-sm"
                          title={`Hapus ${itemLabel}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add Official Post */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={eventOnly ? 'Buat Event Sekolah / Alumni' : 'Buat Lowongan / Beasiswa'}
        maxWidth="600px"
      >
        <form onSubmit={handleCreatePost}>
          <div className="form-group">
            <label className="form-label">{eventOnly ? 'Judul Event *' : 'Judul Lowongan / Beasiswa *'}</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Rekrutmen Khusus Alumni SMAN 1 Talang Padang"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kategori *</label>
              <select
                className="form-input form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {eventOnly ? (
                  <>
                    <option value="event_mahasiswa">Event Mahasiswa</option>
                    <option value="event_umum">Event Alumni / Sekolah</option>
                  </>
                ) : (
                  <>
                    <option value="magang">Magang (Target: Mahasiswa/Gap Year)</option>
                    <option value="full_time">Full Time (Target: Belum Kerja)</option>
                    <option value="part_time">Part Time (Target: Mahasiswa)</option>
                    <option value="beasiswa">Beasiswa (Target: Semua Alumni WA Aktif)</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{eventOnly ? 'Penyelenggara *' : 'Perusahaan / Instansi *'}</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: BUMN / Dinas Pendidikan"
                value={formData.company_or_institution}
                onChange={(e) => setFormData({ ...formData, company_or_institution: e.target.value })}
                required
              />
            </div>
          </div>

          {eventOnly && (
            <div className="form-group">
              <label className="form-label">Status Event *</label>
              <select
                className="form-input form-select"
                value={formData.event_phase}
                onChange={(e) => setFormData({ ...formData, event_phase: e.target.value })}
                required
              >
                <option value="upcoming">Akan datang — tampil di dashboard alumni</option>
                <option value="completed">Sudah berlangsung — tampil di halaman alumni dan publik</option>
              </select>
            </div>
          )}

          {eventOnly && (
            <div className="form-group">
              <label className="form-label">Foto Event (opsional, maks. 5 MB)</label>
              <input
                type="file"
                className="form-input"
                accept="image/*"
                onChange={(e) => setEventImage(e.target.files?.[0] || null)}
              />
              {eventImage && (
                <img
                  src={eventImagePreview}
                  alt="Pratinjau foto event"
                  style={{ display: 'block', marginTop: 10, maxWidth: '100%', maxHeight: 180, borderRadius: 8 }}
                />
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{eventOnly ? 'Deskripsi Event *' : 'Deskripsi & Syarat Kualifikasi *'}</label>
            <textarea
              rows={4}
              className="form-input form-textarea"
              placeholder={eventOnly
                ? 'Tuliskan waktu, lokasi, agenda, dan informasi penting event...'
                : 'Tuliskan rincian persyaratan, batas waktu, dan benefit...'}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Link Pendaftaran (URL)</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://..."
              value={formData.registration_link}
              onChange={(e) => setFormData({ ...formData, registration_link: e.target.value })}
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
              {submitting
                ? 'Menyimpan...'
                : eventOnly ? 'Publikasikan Event' : 'Publikasikan Lowongan & Siarkan WA'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCareerPage;
