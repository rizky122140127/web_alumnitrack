import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

const AlumniDashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tracerCompleted, setTracerCompleted] = useState(false);
  const [recentCareers, setRecentCareers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [answersRes, careersRes] = await Promise.all([
          api.get('/tracer-answers/my').catch(() => ({ data: { answers: [] } })),
          api.get('/career-posts?limit=3').catch(() => ({ data: { data: [] } })),
        ]);

        const answers = answersRes.data?.answers || [];
        setTracerCompleted(answers.length > 0);

        const careers = careersRes.data?.data || careersRes.data || [];
        setRecentCareers(Array.isArray(careers) ? careers.slice(0, 3) : []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Spinner text="Memuat data dashboard..." />;
  }

  const profile = user?.alumni_profile || user?.alumniProfile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div
        className="card-glass"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.875rem', color: '#818cf8', fontWeight: 600 }}>PORTAL ALUMNI RESMI</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: '#f8fafc' }}>
              Halo, {user?.name}! 👋
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              SMAN 1 Talang Padang {profile?.graduation_year ? `• Angkatan ${profile.graduation_year}` : ''}
              {profile?.nisn ? ` (NISN: ${profile.nisn})` : ''}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/alumni/profile" className="btn btn-secondary">
              ✏️ Edit Profil
            </Link>
            {!tracerCompleted && (
              <Link to="/alumni/tracer" className="btn btn-primary">
                ✍️ Isi Tracer Study
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tracer Status Alert */}
      {tracerCompleted ? (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>✅</div>
            <div>
              <h4 style={{ margin: 0, color: '#34d399', fontSize: '1rem', fontWeight: 700 }}>
                Tracer Study Selesai
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                Terima kasih telah berkontribusi memberikan data untuk akreditasi dan evaluasi mutu sekolah.
              </p>
            </div>
          </div>
          <Link to="/alumni/tracer" className="btn btn-secondary btn-sm">
            Lihat Jawaban
          </Link>
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>⚠️</div>
            <div>
              <h4 style={{ margin: 0, color: '#fbbf24', fontSize: '1rem', fontWeight: 700 }}>
                Kuesioner Tracer Study Belum Diisi
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', color: '#cbd5e1', fontSize: '0.875rem' }}>
                Bantu almamater SMAN 1 Talang Padang memperbarui data akreditasi dengan melengkapi kuesioner singkat.
              </p>
            </div>
          </div>
          <Link to="/alumni/tracer" className="btn btn-primary btn-sm">
            Mulai Isi Kuesioner Sekarang →
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            📌
          </div>
          <div>
            <div className="stats-value" style={{ textTransform: 'capitalize' }}>
              {profile?.current_status ? profile.current_status.replace('_', ' ') : 'Belum diisi'}
            </div>
            <div className="stats-label">Status Aktivitas Saat Ini</div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>
            🏛️
          </div>
          <div>
            <div className="stats-value" style={{ fontSize: '1.2rem' }}>
              {profile?.campus_name || profile?.company_name || 'Mandiri / Belum diisi'}
            </div>
            <div className="stats-label">
              {profile?.campus_name ? 'Kampus / Perguruan Tinggi' : profile?.company_name ? 'Instansi / Perusahaan' : 'Institusi'}
            </div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            💬
          </div>
          <div>
            <div className="stats-value" style={{ fontSize: '1.2rem' }}>
              {user?.is_wa_active ? 'Terhubung' : 'Nonaktif'}
            </div>
            <div className="stats-label">Notifikasi Info Karir WA</div>
          </div>
        </div>
      </div>

      {/* Recent Careers Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Lowongan & Peluang Terbaru
            </h3>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Info karir, magang, dan beasiswa yang telah diverifikasi oleh Guru BK SMAN 1 Talang Padang
            </p>
          </div>
          <Link to="/alumni/career" className="btn btn-secondary btn-sm">
            Lihat Semua →
          </Link>
        </div>

        {recentCareers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            Belum ada pengumuman karir aktif saat ini.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {recentCareers.map((post) => (
              <div
                key={post.id}
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <Badge variant={post.category}>{post.category}</Badge>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {post.created_at ? new Date(post.created_at).toLocaleDateString('id-ID') : ''}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: '0.5rem 0' }}>
                    {post.title}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: '#818cf8', marginBottom: '0.5rem' }}>
                    🏢 {post.company_or_institution}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.description}
                  </p>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #334155' }}>
                  {post.registration_link ? (
                    <a
                      href={post.registration_link.startsWith('http') ? post.registration_link : `https://${post.registration_link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', textAlign: 'center' }}
                    >
                      Daftar / Rincian ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Hubungi panitia</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumniDashboardPage;
