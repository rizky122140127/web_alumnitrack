import React, { useState, useEffect } from 'react';
import { Eye, Pencil, Save, X } from 'lucide-react';
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
  const [profileModal, setProfileModal] = useState({ open: false, loading: false, editing: false, alumni: null });
  const [profileForm, setProfileForm] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

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

  const openProfile = async (alumni, editing = false) => {
    setProfileModal({ open: true, loading: true, editing, alumni: null });
    setProfileForm(null);
    try {
      const response = await api.get(`/alumni/${alumni.id}`);
      const fullAlumni = response.data.user;
      const profile = fullAlumni.alumni_profile || fullAlumni.alumniProfile || {};
      setProfileModal({ open: true, loading: false, editing, alumni: fullAlumni });
      setProfileForm({
        name: fullAlumni.name || '',
        email: fullAlumni.email || '',
        phone_number: fullAlumni.phone_number || '',
        is_wa_active: Boolean(fullAlumni.is_wa_active),
        nisn: fullAlumni.nisn || '',
        graduation_year: profile.graduation_year || '',
        current_status: profile.current_status || 'belum_kerja',
        campus_name: profile.campus_name || '',
        major_name: profile.major_name || '',
        company_name: profile.company_name || '',
        job_title: profile.job_title || '',
      });
    } catch (error) {
      console.error('Error loading alumni profile:', error);
      toast.error(error.response?.data?.message || 'Gagal memuat profil alumni.');
      setProfileModal({ open: false, loading: false, editing: false, alumni: null });
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!profileModal.alumni || !profileForm) return;
    setSavingProfile(true);
    try {
      const response = await api.put(`/alumni/${profileModal.alumni.id}`, {
        ...profileForm,
        email: profileForm.email || null,
        graduation_year: Number(profileForm.graduation_year),
      });
      const updated = response.data.user;
      setProfileModal({ open: true, loading: false, editing: false, alumni: { ...profileModal.alumni, ...updated } });
      toast.success('Profil alumni berhasil diperbarui.');
      await fetchAlumni();
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const firstError = validationErrors ? Object.values(validationErrors)[0]?.[0] : null;
      toast.error(firstError || error.response?.data?.message || 'Gagal memperbarui profil alumni.');
    } finally {
      setSavingProfile(false);
    }
  };

  const updateProfileForm = (field, value) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const closeProfile = () => setProfileModal({ open: false, loading: false, editing: false, alumni: null });

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
              Data penelusuran lulusan SMAN 1 Talang Padang beserta status tracer
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
                        <div>NISN: {alumni.nisn || '-'}</div>
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
                          type="button"
                          onClick={() => openProfile(alumni)}
                          className="btn btn-secondary btn-sm"
                          title="Lihat profil alumni"
                        >
                          <Eye size={14} /> Profil
                        </button>
                        <button
                          type="button"
                          onClick={() => openProfile(alumni, true)}
                          className="btn btn-secondary btn-sm"
                          title="Edit data alumni"
                        >
                          <Pencil size={14} /> Edit
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

      <Modal
        isOpen={profileModal.open}
        onClose={closeProfile}
        title={profileModal.editing ? 'Edit Profil Alumni' : 'Profil Alumni'}
        maxWidth="760px"
      >
        {profileModal.loading || !profileModal.alumni ? (
          <Spinner text="Memuat profil alumni..." />
        ) : (
          <>
            <div className="alumni-profile-modal-header">
              <div>
                <h4>{profileModal.alumni.name}</h4>
                <p>{profileModal.alumni.email || 'Email belum diisi'} · {profileModal.alumni.phone_number}</p>
              </div>
              {!profileModal.editing && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setProfileModal((current) => ({ ...current, editing: true }))}>
                  <Pencil size={14} /> Edit data
                </button>
              )}
            </div>

            {profileModal.editing ? (
              <form onSubmit={handleSaveProfile}>
                <div className="alumni-profile-form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="alumni-name">Nama lengkap *</label>
                    <input id="alumni-name" className="form-input" value={profileForm.name} onChange={(event) => updateProfileForm('name', event.target.value)} required maxLength={255} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="alumni-email">Email</label>
                    <input id="alumni-email" type="email" className="form-input" value={profileForm.email} onChange={(event) => updateProfileForm('email', event.target.value)} maxLength={255} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="alumni-phone">Nomor WhatsApp *</label>
                    <input id="alumni-phone" className="form-input" value={profileForm.phone_number} onChange={(event) => updateProfileForm('phone_number', event.target.value)} required maxLength={30} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="alumni-nisn">NISN *</label>
                    <input id="alumni-nisn" className="form-input" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={profileForm.nisn} onChange={(event) => updateProfileForm('nisn', event.target.value.replace(/\D/g, '').slice(0, 10))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="alumni-graduation-year">Tahun lulus *</label>
                    <input id="alumni-graduation-year" type="number" min="2000" max="2099" className="form-input" value={profileForm.graduation_year} onChange={(event) => updateProfileForm('graduation_year', event.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="alumni-current-status">Status terkini *</label>
                    <select id="alumni-current-status" className="form-input form-select" value={profileForm.current_status} onChange={(event) => updateProfileForm('current_status', event.target.value)} required>
                      <option value="mahasiswa">Mahasiswa</option>
                      <option value="gap_year">Gap Year</option>
                      <option value="bekerja">Bekerja</option>
                      <option value="wirausaha">Wirausaha</option>
                      <option value="belum_kerja">Belum bekerja</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="alumni-campus">Perguruan tinggi</label>
                    <input id="alumni-campus" className="form-input" value={profileForm.campus_name} onChange={(event) => updateProfileForm('campus_name', event.target.value)} maxLength={255} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="alumni-major">Program studi</label>
                    <input id="alumni-major" className="form-input" value={profileForm.major_name} onChange={(event) => updateProfileForm('major_name', event.target.value)} maxLength={255} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="alumni-company">Perusahaan/instansi</label>
                    <input id="alumni-company" className="form-input" value={profileForm.company_name} onChange={(event) => updateProfileForm('company_name', event.target.value)} maxLength={255} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="alumni-job-title">Jabatan</label>
                    <input id="alumni-job-title" className="form-input" value={profileForm.job_title} onChange={(event) => updateProfileForm('job_title', event.target.value)} maxLength={255} />
                  </div>
                </div>
                <label className="form-checkbox-item" style={{ marginBottom: '1rem' }}>
                  <input type="checkbox" checked={profileForm.is_wa_active} onChange={(event) => updateProfileForm('is_wa_active', event.target.checked)} />
                  <span>Notifikasi WhatsApp sekolah aktif</span>
                </label>
                <div className="alumni-profile-form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => openProfile(profileModal.alumni)}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                    <Save size={15} /> {savingProfile ? 'Menyimpan...' : 'Simpan perubahan'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="alumni-profile-facts">
                  <div><span>Email</span><strong>{profileModal.alumni.email || '-'}</strong></div>
                  <div><span>Nomor WhatsApp</span><strong>{profileModal.alumni.phone_number}</strong></div>
                  <div><span>NISN</span><strong>{profileForm?.nisn || '-'}</strong></div>
                  <div><span>Tahun lulus</span><strong>{profileForm?.graduation_year || '-'}</strong></div>
                  <div><span>Status</span><strong>{profileForm?.current_status?.replaceAll('_', ' ') || '-'}</strong></div>
                  <div><span>Notifikasi WA</span><strong>{profileModal.alumni.is_wa_active ? 'Aktif' : 'Nonaktif'}</strong></div>
                  <div><span>Perguruan tinggi</span><strong>{profileForm?.campus_name || '-'}</strong></div>
                  <div><span>Program studi</span><strong>{profileForm?.major_name || '-'}</strong></div>
                  <div><span>Perusahaan/instansi</span><strong>{profileForm?.company_name || '-'}</strong></div>
                  <div><span>Jabatan</span><strong>{profileForm?.job_title || '-'}</strong></div>
                </div>
                <h4 className="alumni-answers-heading">Jawaban Tracer Study</h4>
                {profileModal.alumni.tracer_answers?.length ? (
                  <div className="alumni-answers-list">
                    {profileModal.alumni.tracer_answers.map((answer) => (
                      <div key={answer.id}>
                        <span>{answer.question?.question_text || 'Pertanyaan tidak tersedia'}</span>
                        <strong>{typeof answer.answer_value === 'string' ? answer.answer_value : JSON.stringify(answer.answer_value)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="alumni-no-answers">Alumni ini belum mengirim jawaban tracer study.</p>
                )}
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default AdminAlumniPage;
