import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [recapData, setRecapData] = useState(null);
  const [waStats, setWaStats] = useState({ total: 0, sent: 0, queued: 0, failed: 0 });
  const [careerCount, setCareerCount] = useState(0);
  const [alumniCount, setAlumniCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recapRes, waRes, careerRes, alumniRes] = await Promise.all([
          api.get('/tracer-answers/recap').catch(() => ({ data: null })),
          api.get('/wa-notifications/stats').catch(() => ({ data: { stats: {} } })),
          api.get('/career-posts').catch(() => ({ data: { total: 0 } })),
          api.get('/alumni').catch(() => ({ data: { total: 0 } })),
        ]);

        if (recapRes.data) {
          setRecapData(recapRes.data);
        }
        if (waRes.data?.stats) {
          setWaStats(waRes.data.stats);
        }
        setCareerCount(careerRes.data?.total || careerRes.data?.data?.length || 0);
        setAlumniCount(alumniRes.data?.total || 0);
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Spinner text="Memuat dashboard analitik..." />;
  }

  // Setup Doughnut Chart
  const overallDist = recapData?.overall?.distribution || {};
  const doughnutData = {
    labels: ['Mahasiswa (Kuliah)', 'Bekerja', 'Wirausaha', 'Gap Year', 'Belum Bekerja'],
    datasets: [
      {
        data: [
          overallDist.mahasiswa || 0,
          overallDist.bekerja || 0,
          overallDist.wirausaha || 0,
          overallDist.gap_year || 0,
          overallDist.belum_kerja || 0,
        ],
        backgroundColor: [
          '#6366f1', // Indigo
          '#10b981', // Green
          '#f59e0b', // Amber
          '#64748b', // Slate
          '#ef4444', // Red
        ],
        borderColor: '#1e293b',
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          padding: 16,
          font: { size: 12 },
        },
      },
    },
  };

  // Setup Bar Chart for Years
  const yearsRecap = recapData?.recap_per_year || [];
  const barData = {
    labels: yearsRecap.map((y) => `Angkatan ${y.graduation_year}`),
    datasets: [
      {
        label: 'Mahasiswa',
        data: yearsRecap.map((y) => y.distribution?.mahasiswa || 0),
        backgroundColor: '#6366f1',
      },
      {
        label: 'Bekerja',
        data: yearsRecap.map((y) => y.distribution?.bekerja || 0),
        backgroundColor: '#10b981',
      },
      {
        label: 'Wirausaha',
        data: yearsRecap.map((y) => y.distribution?.wirausaha || 0),
        backgroundColor: '#f59e0b',
      },
      {
        label: 'Gap Year / Lainnya',
        data: yearsRecap.map((y) => (y.distribution?.gap_year || 0) + (y.distribution?.belum_kerja || 0)),
        backgroundColor: '#64748b',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(51, 65, 85, 0.5)' },
      },
      y: {
        stacked: true,
        ticks: { color: '#94a3b8', stepSize: 1 },
        grid: { color: 'rgba(51, 65, 85, 0.5)' },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#cbd5e1', padding: 12 },
      },
    },
  };

  const totalTracked = recapData?.overall?.total || alumniCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div
        className="card-glass"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(30, 41, 59, 0.8) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700, letterSpacing: '0.05em' }}>
              PANEL BIMBINGAN KONSELING & AKREDITASI
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: '0.25rem 0' }}>
              Sistem Pelacakan Alumni SMAN 1 Talang Padang
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
              Pantau sebaran lulusan, tingkat keterserapan kerja/kuliah, dan pengiriman pesan WhatsApp Gateway secara real-time.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/admin/alumni" className="btn btn-secondary btn-sm">
              👥 Direktori Alumni
            </Link>
            <Link to="/admin/rekap" className="btn btn-primary btn-sm">
              📄 Rekapitulasi Akreditasi
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            👥
          </div>
          <div>
            <div className="stats-value">{totalTracked}</div>
            <div className="stats-label">Total Alumni Terdata</div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            🎓
          </div>
          <div>
            <div className="stats-value">
              {recapData?.overall?.percentages?.mahasiswa || 0}%
            </div>
            <div className="stats-label">Melanjutkan Kuliah (PTN/PTS)</div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
            💼
          </div>
          <div>
            <div className="stats-value">
              {recapData?.overall?.percentages?.bekerja || 0}%
            </div>
            <div className="stats-label">Langsung Bekerja / Wirausaha</div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            💬
          </div>
          <div>
            <div className="stats-value">{waStats.sent} / {waStats.total}</div>
            <div className="stats-label">Pesan WhatsApp Gateway Terkirim</div>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="charts-grid">
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              📊 Distribusi Status Lulusan
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Persentase mahasiswa, pekerja, wirausaha, dan persiapan
            </span>
          </div>
          <div style={{ flex: 1, minHeight: '300px', position: 'relative' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              📈 Sebaran Alumni per Angkatan
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Grafik komparasi per tahun kelulusan
            </span>
          </div>
          <div style={{ flex: 1, minHeight: '300px', position: 'relative' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#cbd5e1' }}>
          ⚡ Pintasan Cepat Administrasi
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <Link
            to="/admin/alumni"
            style={{
              background: '#0f172a',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>🔗</div>
            <div style={{ fontWeight: 700, color: '#f1f5f9' }}>Generate Magic Link WA</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Buat tautan login 1-klik untuk alumni tanpa ribet password.</div>
          </Link>

          <Link
            to="/admin/tracer-questions"
            style={{
              background: '#0f172a',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>📋</div>
            <div style={{ fontWeight: 700, color: '#f1f5f9' }}>Kelola Soal Kuesioner</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tambah, ubah tipe pilihan, dan atur urutan instrumen tracer.</div>
          </Link>

          <Link
            to="/admin/career"
            style={{
              background: '#0f172a',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>📢</div>
            <div style={{ fontWeight: 700, color: '#f1f5f9' }}>Targeted Push Karir WA</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Kirim broadcast lowongan spesifik ke kelompok alumni yang relevan.</div>
          </Link>

          <Link
            to="/admin/notifications"
            style={{
              background: '#0f172a',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>💬</div>
            <div style={{ fontWeight: 700, color: '#f1f5f9' }}>Pantau WA Gateway</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Lihat log antrian notifikasi, pengiriman, dan status Fonnte.</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
