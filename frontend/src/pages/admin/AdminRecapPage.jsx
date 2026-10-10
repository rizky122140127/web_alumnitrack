import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import Spinner from '../../components/ui/Spinner';

const AdminRecapPage = () => {
  const [recapData, setRecapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchRecap = async () => {
      try {
        setLoading(true);
        const res = await api.get('/tracer-answers/recap');
        setRecapData(res.data);
      } catch (err) {
        console.error('Error fetching accreditation recap:', err);
        toast.error('Gagal memuat rekapitulasi akreditasi.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecap();
  }, [toast]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!recapData?.recap_per_year) return;

    const headers = [
      'Angkatan',
      'Total Alumni',
      'Mahasiswa',
      '% Mahasiswa',
      'Bekerja',
      '% Bekerja',
      'Wirausaha',
      '% Wirausaha',
      'Gap Year / Belum Kerja',
      '% Lainnya',
    ];

    const rows = recapData.recap_per_year.map((item) => {
      const dist = item.distribution || {};
      const pct = item.percentages || {};
      const others = (dist.gap_year || 0) + (dist.belum_kerja || 0);
      const othersPct = ((pct.gap_year || 0) + (pct.belum_kerja || 0)).toFixed(2);

      return [
        item.graduation_year,
        item.total,
        dist.mahasiswa || 0,
        `${pct.mahasiswa || 0}%`,
        dist.bekerja || 0,
        `${pct.bekerja || 0}%`,
        dist.wirausaha || 0,
        `${pct.wirausaha || 0}%`,
        others,
        `${othersPct}%`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_akreditasi_sman1_talang_padang_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV berhasil diunduh!');
  };

  if (loading) {
    return <Spinner text="Menghitung rekapitulasi data akreditasi..." />;
  }

  const overall = recapData?.overall || { total: 0, distribution: {}, percentages: {} };
  const perYear = recapData?.recap_per_year || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700 }}>
              STANDAR AKREDITASI & EVALUASI DIRI SEKOLAH
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0.25rem 0' }}>
              Rekapitulasi Penelusuran Lulusan (Tracer Study)
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
              SMA Negeri 1 Talang Padang — Data agregat keterserapan alumni di perguruan tinggi dan dunia kerja
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
              📥 Unduh CSV
            </button>
            <button onClick={handlePrint} className="btn btn-primary btn-sm">
              🖨️ Cetak / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid">
        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            🎓
          </div>
          <div>
            <div className="stats-value">{overall.percentages?.mahasiswa || 0}%</div>
            <div className="stats-label">Lanjut PTN / PTS ({overall.distribution?.mahasiswa || 0} orang)</div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            💼
          </div>
          <div>
            <div className="stats-value">{overall.percentages?.bekerja || 0}%</div>
            <div className="stats-label">Langsung Bekerja ({overall.distribution?.bekerja || 0} orang)</div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            🏪
          </div>
          <div>
            <div className="stats-value">{overall.percentages?.wirausaha || 0}%</div>
            <div className="stats-label">Wirausaha Mandiri ({overall.distribution?.wirausaha || 0} orang)</div>
          </div>
        </div>

        <div className="card-stats">
          <div className="stats-icon" style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8' }}>
            ⏳
          </div>
          <div>
            <div className="stats-value">
              {((overall.percentages?.gap_year || 0) + (overall.percentages?.belum_kerja || 0)).toFixed(1)}%
            </div>
            <div className="stats-label">Persiapan / Gap Year ({((overall.distribution?.gap_year || 0) + (overall.distribution?.belum_kerja || 0))} orang)</div>
          </div>
        </div>
      </div>

      {/* Main Table Breakdown */}
      <div className="card" style={{ padding: '0.5rem' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #334155' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Tabel Rekapitulasi per Tahun Kelulusan (Angkatan)
          </h3>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tahun Kelulusan</th>
                <th>Total Responden</th>
                <th>Kuliah (PTN/PTS)</th>
                <th>Bekerja</th>
                <th>Wirausaha</th>
                <th>Gap Year / Persiapan</th>
                <th>Tingkat Keterserapan</th>
              </tr>
            </thead>
            <tbody>
              {perYear.map((row) => {
                const dist = row.distribution || {};
                const pct = row.percentages || {};
                const absorbedPct = (
                  (pct.mahasiswa || 0) +
                  (pct.bekerja || 0) +
                  (pct.wirausaha || 0)
                ).toFixed(1);

                return (
                  <tr key={row.graduation_year}>
                    <td style={{ fontWeight: 700, color: '#818cf8' }}>
                      Angkatan {row.graduation_year}
                    </td>
                    <td style={{ fontWeight: 600 }}>{row.total} Alumni</td>
                    <td>
                      <div>{dist.mahasiswa || 0} orang</div>
                      <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>
                        {pct.mahasiswa || 0}%
                      </div>
                    </td>
                    <td>
                      <div>{dist.bekerja || 0} orang</div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                        {pct.bekerja || 0}%
                      </div>
                    </td>
                    <td>
                      <div>{dist.wirausaha || 0} orang</div>
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                        {pct.wirausaha || 0}%
                      </div>
                    </td>
                    <td>
                      <div>{(dist.gap_year || 0) + (dist.belum_kerja || 0)} orang</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {((pct.gap_year || 0) + (pct.belum_kerja || 0)).toFixed(1)}%
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, background: '#334155', height: '6px', borderRadius: '3px' }}>
                          <div
                            style={{
                              width: `${absorbedPct}%`,
                              height: '100%',
                              borderRadius: '3px',
                              background: '#10b981',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>
                          {absorbedPct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRecapPage;
