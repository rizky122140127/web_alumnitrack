import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const AdminAlumniPage = () => {
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [magicLinkModal, setMagicLinkModal] = useState({ open: false, url: '', alumni: null });
  const [generatingLink, setGeneratingLink] = useState(false);

  const toast = useToast();

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (yearFilter) params.append('graduation_year', yearFilter);
      if (statusFilter) params.append('current_status', statusFilter);
      params.append('page', page);

      const res = await api.get(`/alumni?${params.toString()}`);
      const data = res.data?.data || res.data || [];
      setAlumniList(Array.isArray(data) ? data : []);
      setTotalPages(res.data?.last_page || 1);
    } catch (err) {
      console.error('Error fetching alumni list:', err);
      toast.error('Gagal mengambil daftar alumni.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, [page, yearFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAlumni();
  };

  const handleGenerateMagicLink = async (alumni) => {
    setGeneratingLink(true);
    try {
      const res = await api.post('/auth/generate-magic-link', { user_id: alumni.id });
      setMagicLinkModal({
        open: true,
        url: res.data.magic_link,
        alumni,
      });
      toast.success(`Magic link untuk ${alumni.name} berhasil dibuat!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat magic link.');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.info('Tautan berhasil disalin ke clipboard!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Direktori & Database Alumni
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Data penelusuran lulusan SMAN 1 Talang Padang beserta status tracer dan akses Magic Link
            </p>
          </div>
        </div>

        {/* Filters and search bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 300px', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Cari nama, NISN, telepon, kampus, instansi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Cari
            </button>
          </form>

          <select
            className="form-input form-select"
            value={yearFilter}
            onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
            style={{ width: '170px' }}
          >
            <option value="">Semua Angkatan</option>
            <option value="2024">Angkatan 2024</option>
            <option value="2023">Angkatan 2023</option>
            <option value="2022">Angkatan 2022</option>
            <option value="2021">Angkatan 2021</option>
            <option value="2020">Angkatan 2020</option>
          </select>

          <select
            className="form-input form-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: '180px' }}
          >
            <option value="">Semua Status</option>
            <option value="mahasiswa">Mahasiswa (Kuliah)</option>
            <option value="bekerja">Bekerja</option>
            <option value="wirausaha">Wirausaha</option>
            <option value="gap_year">Gap Year</option>
            <option value="belum_kerja">Belum Bekerja</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <Spinner text="Memuat daftar alumni..." />
        ) : alumniList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Tidak ada data alumni yang cocok dengan pencarian / filter.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Lengkap</th>
                  <th>No. WhatsApp</th>
                  <th>NISN / Angkatan</th>
                  <th>Status & Institusi</th>
                  <th>Tracer Study</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {alumniList.map((alumni) => {
                  const prof = alumni.alumni_profile || alumni.alumniProfile;
                  const hasAnswered = alumni.tracer_answers?.length > 0;

                  return (
                    <tr key={alumni.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{alumni.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{alumni.email || '-'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{alumni.phone_number}</span>
                          {alumni.is_wa_active && (
                            <span title="Notifikasi WA aktif" style={{ color: '#10b981', fontSize: '0.8rem' }}>●</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>NISN: {prof?.nisn || '-'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>
                          Lulus: {prof?.graduation_year || '-'}
                        </div>
                      </td>
                      <td>
                        <div style={{ marginBottom: '4px' }}>
                          <Badge variant={prof?.current_status || 'secondary'}>
                            {prof?.current_status ? prof.current_status.replace('_', ' ') : '-'}
                          </Badge>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {prof?.campus_name
                            ? `${prof.campus_name} (${prof.major_name || ''})`
                            : prof?.company_name
                            ? `${prof.company_name} - ${prof.job_title || ''}`
                            : '-'}
                        </div>
                      </td>
                      <td>
                        {hasAnswered ? (
                          <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                            ✅ Sudah Mengisi
                          </span>
                        ) : (
                          <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
                            ⏳ Belum Mengisi
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleGenerateMagicLink(alumni)}
                          className="btn btn-secondary btn-sm"
                          disabled={generatingLink}
                          title="Generate link login 1-klik untuk WhatsApp"
                        >
                          🔗 Magic Link
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary btn-sm"
            >
              ← Sebelumnya
            </button>
            <span style={{ alignSelf: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Selanjutnya →
            </button>
          </div>
        )}
      </div>

      {/* Magic Link Modal */}
      <Modal
        isOpen={magicLinkModal.open}
        onClose={() => setMagicLinkModal({ open: false, url: '', alumni: null })}
        title="Magic Link Login WhatsApp"
        maxWidth="500px"
      >
        <div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Tautan otentikasi sekali klik otomatis untuk:{' '}
            <strong style={{ color: '#f8fafc' }}>{magicLinkModal.alumni?.name}</strong> (
            {magicLinkModal.alumni?.phone_number}). Tautan ini berlaku selama 24 jam.
          </p>

          <div className="form-group">
            <label className="form-label">Tautan Magic Link:</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                readOnly
                value={magicLinkModal.url}
                className="form-input"
                style={{ fontSize: '0.8rem', background: '#0f172a' }}
              />
              <button
                type="button"
                onClick={() => copyToClipboard(magicLinkModal.url)}
                className="btn btn-primary btn-sm"
              >
                Salin
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <a
              href={`https://wa.me/${magicLinkModal.alumni?.phone_number}?text=${encodeURIComponent(
                `Halo ${magicLinkModal.alumni?.name}, berikut tautan masuk langsung untuk mengisi Tracer Study SMAN 1 Talang Padang: ${magicLinkModal.url}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ background: '#25D366' }}
            >
              💬 Kirim via WhatsApp Web ↗
            </a>
            <button
              type="button"
              onClick={() => setMagicLinkModal({ open: false, url: '', alumni: null })}
              className="btn btn-secondary"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAlumniPage;
