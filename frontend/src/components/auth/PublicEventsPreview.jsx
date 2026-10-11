import React, { useEffect, useState } from 'react';
import { CalendarDays, ExternalLink } from 'lucide-react';
import api from '../../api/axios';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';

const categoryLabels = {
  event_mahasiswa: 'Event Mahasiswa',
  event_umum: 'Event Alumni / Sekolah',
};

const PublicEventsPreview = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/public/events')
      .then((response) => setEvents(response.data?.data || []))
      .catch((requestError) => {
        console.error('Failed to load public events:', requestError);
        setError('Event belum dapat dimuat. Silakan coba muat ulang halaman.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="public-events-preview" aria-labelledby="public-events-title">
      <div className="public-events-heading">
        <div>
          <span className="auth-eyebrow">AGENDA SEKOLAH & ALUMNI</span>
          <h2 id="public-events-title">Arsip event</h2>
          <p>Lihat kegiatan sekolah dan alumni yang telah berlangsung.</p>
        </div>
        <CalendarDays size={24} aria-hidden="true" />
      </div>

      {loading ? (
        <Spinner text="Memuat event..." />
      ) : error ? (
        <p className="public-events-empty" role="status">{error}</p>
      ) : events.length === 0 ? (
        <p className="public-events-empty">Belum ada event yang dipublikasikan.</p>
      ) : (
        <div className="public-events-grid">
          {events.map((event) => (
            <article className="public-event-card" key={event.id}>
              <div className="public-event-meta">
                <Badge variant={event.category}>{categoryLabels[event.category] || 'Event'}</Badge>
                <time dateTime={event.created_at}>
                  {event.created_at ? new Date(event.created_at).toLocaleDateString('id-ID') : ''}
                </time>
              </div>
              {event.event_image_url && (
                <img
                  src={event.event_image_url}
                  alt={`Foto ${event.title}`}
                  style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, margin: '0.75rem 0' }}
                />
              )}
              <h3>{event.title}</h3>
              <p className="public-event-organizer">{event.company_or_institution}</p>
              <p className="public-event-description">{event.description}</p>
              <div className="public-event-footer">
                <span>Oleh {event.author?.name || 'Sekolah / Alumni'}</span>
                {event.registration_link && (
                  <a href={event.registration_link} target="_blank" rel="noopener noreferrer">
                    Detail <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default PublicEventsPreview;
