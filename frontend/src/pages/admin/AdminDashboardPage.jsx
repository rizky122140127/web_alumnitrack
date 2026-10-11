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
          api.get('/career-posts?status=approved').catch(() => ({ data: { total: 0 } })),
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
        backgroundColor: ['#456c83', '#477460', '#ad8542', '#89958d', '#b56a5d'],
        borderColor: '#ffffff',
        borderWidth: 3,
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
          color: '#58665f',
          padding: 16,
          font: { size: 12 },
        },
      },
    },
  };

  // Setup bar chart for the most popular higher-education institutions
  const topCampuses = recapData?.top_campuses || [];
  const barData = {
    labels: topCampuses.map((campus) => campus.campus_name),
    datasets: [
      {
        label: 'Jumlah Alumni',
        data: topCampuses.map((campus) => campus.total),
        backgroundColor: '#477460',
        borderRadius: 3,
        barThickness: 18,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: '#68756e', precision: 0, stepSize: 1 },
        grid: { color: '#e9eeeb' },
      },
      y: {
        ticks: { color: '#68756e' },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  const totalTracked = recapData?.overall?.total ?? alumniCount;
  const responseRate = recapData?.response_rate?.percentage ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div
        className="card-glass"
        style={{
          background: '#ffffff',
          border: '1px solid #dfe5e1',
          padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#31594b', fontWeight: 700, letterSpacing: '0.05em' }}>
              PANEL ADMINISTRASI & AKREDITASI
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#202a26', margin: '0.25rem 0' }}>
              Sistem Pelacakan Alumni SMAN 1 Talang Padang
            </h1>
            <p style={{ color: '#68756e', fontSize: '0.875rem', margin: 0 }}>
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
          <div className="stats-icon">👥</div>
          <div>
            <div className="stats-value">{totalTracked}</div>
            <div className="stats-label">Total Alumni Terdata</div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon">📋</div>
          <div>
            <div className="stats-value">
              {responseRate}%
            </div>
            <div className="stats-label">Response Rate Kuesioner</div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon">💼</div>
          <div>
            <div className="stats-value">{careerCount}</div>
            <div className="stats-label">Postingan Karier Aktif</div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon">💬</div>
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#202a26' }}>
              📊 Distribusi Status Lulusan
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#68756e' }}>
              Persentase mahasiswa, pekerja, wirausaha, dan persiapan
            </span>
          </div>
          <div style={{ flex: 1, minHeight: '300px', position: 'relative' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#202a26' }}>
              📈 10 Perguruan Tinggi Favorit
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#68756e' }}>
              Kampus dengan jumlah alumni terbanyak
            </span>
          </div>
          <div style={{ flex: 1, minHeight: '300px', position: 'relative' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#202a26' }}>
          ⚡ Pintasan Cepat Administrasi
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <Link
            to="/admin/notifications"
            style={{
              background: '#f7f9f7',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid #dfe5e1',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>💬</div>
            <div style={{ fontWeight: 700, color: '#202a26' }}>Pengingat & Notifikasi WA</div>
            <div style={{ fontSize: '0.8rem', color: '#68756e' }}>Kirim pengingat tracer atau broadcast kepada alumni terpilih.</div>
          </Link>

          <Link
            to="/admin/tracer-questions"
            style={{
              background: '#f7f9f7',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid #dfe5e1',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>📋</div>
            <div style={{ fontWeight: 700, color: '#202a26' }}>Kelola Soal Kuesioner</div>
            <div style={{ fontSize: '0.8rem', color: '#68756e' }}>Tambah, ubah tipe pilihan, dan atur urutan instrumen tracer.</div>
          </Link>

          <Link
            to="/admin/career"
            style={{
              background: '#f7f9f7',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid #dfe5e1',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>📢</div>
            <div style={{ fontWeight: 700, color: '#202a26' }}>Moderasi Karir & Event</div>
            <div style={{ fontSize: '0.8rem', color: '#68756e' }}>Kelola lowongan dan event serta jangkauan notifikasi otomatis.</div>
          </Link>

          <Link
            to="/admin/notifications"
            style={{
              background: '#f7f9f7',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid #dfe5e1',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>💬</div>
            <div style={{ fontWeight: 700, color: '#202a26' }}>Pantau WA Gateway</div>
            <div style={{ fontSize: '0.8rem', color: '#68756e' }}>Lihat log antrian notifikasi, pengiriman, dan status Fonnte.</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
