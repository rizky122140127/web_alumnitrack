import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const alumniStatuses = [
  { value: 'mahasiswa', label: 'Mahasiswa' },
  { value: 'gap_year', label: 'Gap year' },
  { value: 'bekerja', label: 'Bekerja' },
  { value: 'wirausaha', label: 'Wirausaha' },
  { value: 'belum_kerja', label: 'Belum bekerja' },
];

const AdminNotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, queued: 0, sent: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [broadcastStatuses, setBroadcastStatuses] = useState([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const toast = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('notification_type', typeFilter);
      params.append('page', page);

      const [logsRes, statsRes] = await Promise.all([
        api.get(`/wa-notifications?${params.toString()}`),
        api.get('/wa-notifications/stats'),
      ]);

      const logData = logsRes.data?.data || logsRes.data || [];
      setNotifications(Array.isArray(logData) ? logData : []);
      setTotalPages(logsRes.data?.last_page || 1);

      if (statsRes.data?.stats) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Error fetching WA notification logs:', err);
      toast.error('Gagal mengambil riwayat pesan WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter, typeFilter]);

  const handleSendTracerReminders = async () => {
    if (!window.confirm('Kirim pengingat tracer study dan tautan akses 24 jam kepada semua alumni yang belum mengisi dan mengaktifkan notifikasi WhatsApp?')) {
      return;
    }

    setSendingReminders(true);
    try {
      const response = await api.post('/wa-notifications/send-tracer-reminders');
      toast.success(response.data?.message || 'Pengingat tracer berhasil dimasukkan ke antrean.');
      await fetchLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengirim pengingat tracer WhatsApp.');
    } finally {
      setSendingReminders(false);
    }
  };

  const toggleBroadcastStatus = (status) => {
    setBroadcastStatuses((current) => (
      current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status]
    ));
  };

  const handleSendTargetedBroadcast = async (event) => {
    event.preventDefault();
    if (broadcastStatuses.length === 0) {
      toast.warning('Pilih minimal satu status alumni sebagai penerima.');
      return;
    }

    if (!broadcastMessage.trim()) {
      toast.warning('Isi pesan notifikasi terlebih dahulu.');
      return;
    }

    const recipientLabels = alumniStatuses
      .filter(({ value }) => broadcastStatuses.includes(value))
      .map(({ label }) => label)
      .join(', ');

    if (!window.confirm(`Kirim pesan kepada alumni approved yang mengaktifkan WA dengan status: ${recipientLabels}?`)) {
      return;
    }

    setSendingBroadcast(true);
    try {
      const response = await api.post('/wa-notifications/send-targeted', {
        statuses: broadcastStatuses,
        message: broadcastMessage.trim(),
      });
      toast.success(response.data?.message || 'Notifikasi berhasil dimasukkan ke antrean.');
      setBroadcastMessage('');
      setPage(1);
      await fetchLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengirim notifikasi terarah.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700 }}>
              INTEGRASI WA GATEWAY (FONNTE / WABLAS)
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0.25rem 0' }}>
              Log Notifikasi & Targeted Broadcast WhatsApp
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
              Pantau status antrean pengiriman reminder kuesioner dan rekomendasi info karir
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select
              className="form-input form-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ width: '150px' }}
            >
              <option value="">Semua Status</option>
              <option value="sent">Terkirim (Sent)</option>
              <option value="queued">Antrian (Queued)</option>
              <option value="failed">Gagal (Failed)</option>
            </select>

            <select
              className="form-input form-select"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              style={{ width: '180px' }}
            >
              <option value="">Semua Tipe</option>
              <option value="targeted_push">Push Karier / Broadcast</option>
              <option value="reminder_tracer">Reminder Tracer</option>
            </select>
          </div>
        </div>
      </div>

      <section className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Pengingat tracer study</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
            Kirim pengingat tracer kepada alumni yang belum mengisi kuesioner. Pesan berisi tautan login resmi NISN/password.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleSendTracerReminders} disabled={sendingReminders}>
          <Send size={16} />
          {sendingReminders ? 'Memasukkan ke antrean...' : 'Kirim Pengingat Massal'}
        </button>
      </section>

      <form className="card" onSubmit={handleSendTargetedBroadcast}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Kirim notifikasi berdasarkan status alumni</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
            Penerima hanya alumni yang sudah disetujui dan mengaktifkan notifikasi WhatsApp.
          </p>
        </div>

        <fieldset style={{ border: 0, padding: 0, margin: '0 0 1rem' }}>
          <legend className="form-label">Status penerima</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem' }}>
            {alumniStatuses.map(({ value, label }) => (
              <label
                key={value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.65rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  value={value}
                  checked={broadcastStatuses.includes(value)}
                  onChange={() => toggleBroadcastStatus(value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="form-label" htmlFor="targeted-broadcast-message">Isi pesan</label>
        <textarea
          id="targeted-broadcast-message"
          className="form-input form-textarea"
          value={broadcastMessage}
          onChange={(event) => setBroadcastMessage(event.target.value)}
          maxLength={4096}
          placeholder="Tulis informasi atau pengumuman untuk alumni yang dipilih..."
          required
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            {broadcastMessage.length}/4096 karakter
          </span>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sendingBroadcast || broadcastStatuses.length === 0 || !broadcastMessage.trim()}
          >
            <Send size={16} />
            {sendingBroadcast ? 'Memasukkan ke antrean...' : 'Kirim ke Status Terpilih'}
          </button>
        </div>
      </form>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            💬
          </div>
          <div>
            <div className="stats-value">{stats.total}</div>
            <div className="stats-label">Total Pesan Dibuat</div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            ✅
          </div>
          <div>
            <div className="stats-value">{stats.sent}</div>
            <div className="stats-label">Berhasil Dikirim (Sent)</div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            ⏳
          </div>
          <div>
            <div className="stats-value">{stats.queued}</div>
            <div className="stats-label">Dalam Antrian (Queued)</div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            ⚠️
          </div>
          <div>
            <div className="stats-value">{stats.failed}</div>
            <div className="stats-label">Gagal Terkirim (Failed)</div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <Spinner text="Memuat riwayat log notifikasi..." />
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Belum ada catatan pengiriman pesan notifikasi WhatsApp.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Penerima (Alumni)</th>
                  <th>Tipe Pesan</th>
                  <th>Konteks Lowongan</th>
                  <th>Isi Pesan WhatsApp</th>
                  <th>Status</th>
                  <th>Waktu Pengiriman</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {item.user?.name || `User #${item.user_id}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>
                        📱 {item.user?.phone_number || '-'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                        {item.notification_type === 'targeted_push'
                          ? item.career_post?.title ? '📢 Push Karier' : '📣 Broadcast Admin'
                          : '⏰ Reminder'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                        {item.career_post?.title || '-'}
                      </div>
                    </td>
                    <td>
                      <div
                        onClick={() => setSelectedMessage(item)}
                        style={{
                          fontSize: '0.8rem',
                          color: '#94a3b8',
                          maxWidth: '300px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                        title="Klik untuk membaca pesan utuh"
                      >
                        {item.message_content}
                      </div>
                    </td>
                    <td>
                      <Badge variant={item.status}>{item.status}</Badge>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {item.sent_at
                          ? new Date(item.sent_at).toLocaleString('id-ID')
                          : item.created_at
                          ? new Date(item.created_at).toLocaleString('id-ID')
                          : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
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

      {/* Message Modal Preview */}
      <Modal
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        title="Detail Pesan WhatsApp Gateway"
        maxWidth="500px"
      >
        {selectedMessage && (
          <div>
            <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <div><strong>Kepada:</strong> {selectedMessage.user?.name} ({selectedMessage.user?.phone_number})</div>
              <div><strong>Status:</strong> <Badge variant={selectedMessage.status}>{selectedMessage.status}</Badge></div>
            </div>

            <div
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                fontSize: '0.875rem',
                color: '#f1f5f9',
                whiteSpace: 'pre-line',
                lineHeight: 1.6,
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {selectedMessage.message_content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="btn btn-secondary"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminNotificationPage;
