import React, { useCallback, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

const statusLabels = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

const AdminRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const toast = useToast();

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ status: statusFilter, page: String(page) });
      const response = await api.get(`/alumni-registrations?${params.toString()}`);
      setRegistrations(response.data?.data || []);
      setTotalPages(response.data?.last_page || 1);
    } catch (error) {
      console.error('Error fetching alumni registrations:', error);
      toast.error('Gagal mengambil daftar pendaftaran alumni.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const updateStatus = async (registration, status) => {
    const action = status === 'approved' ? 'menyetujui' : 'menolak';
    if (!window.confirm(`Apakah Anda yakin ingin ${action} pendaftaran ${registration.name}?`)) return;

    setUpdatingId(registration.id);
    try {
      const response = await api.patch(`/alumni-registrations/${registration.id}`, { status });
      toast.success(response.data?.message || 'Status pendaftaran berhasil diperbarui.');
      await fetchRegistrations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui status pendaftaran.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Verifikasi Pendaftaran Alumni</h1>
            <p style={{ margin: '0.35rem 0 0' }}>
              Periksa data calon alumni sebelum memberi akses ke portal, kuesioner tracer, dan layanan sekolah.
            </p>
          </div>
          <select
            className="form-input form-select"
            value={statusFilter}
            onChange={handleFilterChange}
            style={{ width: '200px' }}
            aria-label="Filter status pendaftaran"
          >
            <option value="pending">Menunggu verifikasi</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
            <option value="all">Semua pendaftaran</option>
          </select>
        </div>
      </section>

      <section className="card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <Spinner text="Memuat pendaftaran alumni..." />
        ) : registrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            Tidak ada pendaftaran pada status ini.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Calon Alumni</th>
                  <th>NISN</th>
                  <th>Kontak</th>
                  <th>Angkatan</th>
                  <th>Status Aktivitas</th>
                  <th>Status Verifikasi</th>
                  <th style={{ textAlign: 'right' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => {
                  const profile = registration.alumni_profile || registration.alumniProfile;
                  return (
                    <tr key={registration.id}>
                      <td>
                        <div style={{ fontWeight: 650 }}>{registration.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{registration.email || 'Email belum diisi'}</div>
                      </td>
                      <td>{registration.nisn || '-'}</td>
                      <td>{registration.phone_number}</td>
                      <td>{profile?.graduation_year || '-'}</td>
                      <td>{profile?.current_status?.replaceAll('_', ' ') || '-'}</td>
                      <td><Badge variant={registration.alumni_approval_status}>{statusLabels[registration.alumni_approval_status] || registration.alumni_approval_status}</Badge></td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          {registration.alumni_approval_status !== 'approved' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => updateStatus(registration, 'approved')}
                              disabled={updatingId === registration.id}
                            >
                              <Check size={15} /> Setujui
                            </button>
                          )}
                          {registration.alumni_approval_status !== 'rejected' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => updateStatus(registration, 'rejected')}
                              disabled={updatingId === registration.id}
                            >
                              <X size={15} /> Tolak
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="btn btn-secondary btn-sm">Sebelumnya</button>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Halaman {page} dari {totalPages}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="btn btn-secondary btn-sm">Selanjutnya</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminRegistrationsPage;
