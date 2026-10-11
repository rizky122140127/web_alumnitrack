import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const eventCategoryLabels = {
  event_mahasiswa: 'Event Mahasiswa',
  event_umum: 'Event Umum',
};

const EventListPage = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'event_umum',
    company_or_institution: '',
    description: '',
    registration_link: '',
  });
  const toast = useToast();

  const fetchEvents = useCallback(async () => {
    try {
      const responses = await Promise.all([
        api.get('/career-posts?category=event_mahasiswa&event_phase=completed'),
        api.get('/career-posts?category=event_umum&event_phase=completed'),
      ]);
      const items = responses.flatMap((response) => response.data?.data || []);
      setEvents(items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Error fetching alumni events:', error);
      toast.error('Gagal memuat daftar event sekolah dan alumni.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/career-posts', {
        ...formData,
        registration_link: formData.registration_link || null,
      });
      toast.success('Event berhasil dikirim dan menunggu persetujuan admin. Event tidak mengirim notifikasi WhatsApp.');
      setModalOpen(false);
      setFormData({
        title: '',
        category: 'event_umum',
        company_or_institution: '',
        description: '',
        registration_link: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengirim event.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const query = search.trim().toLowerCase();
    return !query || [
      event.title,
      event.company_or_institution,
      event.description,
    ].some((value) => value?.toLowerCase().includes(query));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <CalendarDays size={25} color="var(--color-primary)" />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 750 }}>Event Sekolah & Alumni</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Arsip webinar, kegiatan kampus, reuni, dan acara komunitas alumni yang telah berlangsung.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            + Bagikan Event
          </button>
        </div>
        <label className="event-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            className="form-input"
            aria-label="Cari event"
            placeholder="Cari judul, penyelenggara, atau deskripsi event..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      {loading ? (
        <Spinner text="Memuat event sekolah dan alumni..." />
      ) : filteredEvents.length === 0 ? (
        <section className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <CalendarDays size={34} color="var(--color-text-secondary)" />
          <h2 style={{ marginTop: '0.75rem', fontSize: '1.05rem' }}>
            {events.length ? 'Event tidak ditemukan' : 'Belum ada event'}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.35rem' }}>
            {events.length ? 'Coba gunakan kata kunci lain.' : 'Event baru yang disetujui sekolah atau admin akan tampil di sini.'}
          </p>
        </section>
      ) : (
        <div className="event-list-grid">
          {filteredEvents.map((event) => (
            <article className="card event-list-card" key={event.id}>
              <div>
                <div className="event-list-meta">
                  <Badge variant={event.category}>{eventCategoryLabels[event.category] || 'Event'}</Badge>
                  <time dateTime={event.created_at}>
                    {event.created_at ? new Date(event.created_at).toLocaleDateString('id-ID') : ''}
                  </time>
                </div>
                {event.event_image_url && (
                  <img
                    src={event.event_image_url}
                    alt={`Foto ${event.title}`}
                    style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8, margin: '0.75rem 0' }}
                  />
                )}
                <h2>{event.title}</h2>
                <p className="event-list-organizer">{event.company_or_institution}</p>
                <p className="event-list-description">{event.description}</p>
              </div>
              <footer>
                <span>Diselenggarakan oleh {event.author?.name || 'Sekolah / Alumni'}</span>
                {event.registration_link && (
                  <a
                    href={event.registration_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    Detail / Daftar ↗
                  </a>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Bagikan Event"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateEvent}>
          <div className="form-group">
            <label className="form-label">Judul Event *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              maxLength={255}
              required
            />
          </div>

          <div className="auth-form-grid">
            <div className="form-group">
              <label className="form-label">Kategori *</label>
              <select
                name="category"
                className="form-input form-select"
                value={formData.category}
                onChange={(event) => setFormData({ ...formData, category: event.target.value })}
              >
                <option value="event_umum">Event Alumni / Sekolah</option>
                <option value="event_mahasiswa">Event Mahasiswa</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Penyelenggara *</label>
              <input
                type="text"
                name="company_or_institution"
                className="form-input"
                value={formData.company_or_institution}
                onChange={(event) => setFormData({ ...formData, company_or_institution: event.target.value })}
                maxLength={255}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi Event *</label>
            <textarea
              name="description"
              rows={4}
              className="form-input form-textarea"
              placeholder="Tuliskan agenda, waktu, lokasi, dan informasi penting lainnya."
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Link Informasi / Pendaftaran (opsional)</label>
            <input
              type="url"
              name="registration_link"
              className="form-input"
              placeholder="https://..."
              value={formData.registration_link}
              onChange={(event) => setFormData({ ...formData, registration_link: event.target.value })}
              maxLength={255}
            />
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Event akan tampil setelah disetujui admin. Posting event tidak mengirim notifikasi WhatsApp.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Mengirim...' : 'Kirim untuk Persetujuan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventListPage;
