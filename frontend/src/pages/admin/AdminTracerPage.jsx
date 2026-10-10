import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const AdminTracerPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'text',
    optionsText: '',
    is_required: true,
    order_number: 1,
  });

  const toast = useToast();

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tracer-questions');
      const list = res.data?.questions || res.data?.data || res.data || [];
      setQuestions(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching tracer questions:', err);
      toast.error('Gagal mengambil daftar pertanyaan tracer study.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setFormData({
      question_text: '',
      question_type: 'radio',
      optionsText: 'Pilihan 1\nPilihan 2\nPilihan 3',
      is_required: true,
      order_number: questions.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (q) => {
    setEditingQuestion(q);
    const rawOptions = typeof q.options === 'string' ? JSON.parse(q.options || '[]') : (q.options || []);
    setFormData({
      question_text: q.question_text,
      question_type: q.question_type,
      optionsText: Array.isArray(rawOptions) ? rawOptions.join('\n') : '',
      is_required: q.is_required,
      order_number: q.order_number,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const optionsArray = ['radio', 'checkbox'].includes(formData.question_type)
        ? formData.optionsText
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : null;

      const payload = {
        question_text: formData.question_text,
        question_type: formData.question_type,
        options: optionsArray,
        is_required: formData.is_required,
        order_number: parseInt(formData.order_number),
      };

      if (editingQuestion) {
        await api.put(`/tracer-questions/${editingQuestion.id}`, payload);
        toast.success('Pertanyaan berhasil diperbarui!');
      } else {
        await api.post('/tracer-questions', payload);
        toast.success('Pertanyaan baru berhasil ditambahkan!');
      }

      setModalOpen(false);
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan pertanyaan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pertanyaan ini? Jawaban terkait juga dapat terpengaruh.')) {
      return;
    }

    try {
      await api.delete(`/tracer-questions/${id}`);
      toast.success('Pertanyaan berhasil dihapus.');
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pertanyaan.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Manajemen Instrumen Kuesioner Tracer Study
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Atur daftar butir pertanyaan untuk survei penelusuran lulusan SMAN 1 Talang Padang
            </p>
          </div>

          <button onClick={openCreateModal} className="btn btn-primary">
            ➕ Tambah Butir Soal
          </button>
        </div>
      </div>

      {/* Question List */}
      <div className="card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <Spinner text="Memuat daftar butir pertanyaan..." />
        ) : questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Belum ada butir pertanyaan yang dibuat.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>No.</th>
                  <th>Butir Pertanyaan</th>
                  <th style={{ width: '130px' }}>Tipe Input</th>
                  <th style={{ width: '100px' }}>Wajib?</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => {
                  const rawOptions = typeof q.options === 'string' ? JSON.parse(q.options || '[]') : (q.options || []);

                  return (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 700, color: '#818cf8' }}>
                        #{q.order_number}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                          {q.question_text}
                        </div>
                        {Array.isArray(rawOptions) && rawOptions.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            Pilihan: {rawOptions.join(' • ')}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: '#334155',
                          color: '#cbd5e1',
                          textTransform: 'uppercase'
                        }}>
                          {q.question_type}
                        </span>
                      </td>
                      <td>
                        {q.is_required ? (
                          <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8rem' }}>Ya (Wajib)</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Opsional</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => openEditModal(q)}
                            className="btn btn-secondary btn-sm"
                            title="Edit pertanyaan"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="btn btn-danger btn-sm"
                            title="Hapus pertanyaan"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingQuestion ? 'Edit Butir Pertanyaan' : 'Tambah Butir Pertanyaan Baru'}
        maxWidth="600px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Teks Pertanyaan *</label>
            <textarea
              rows={3}
              className="form-input form-textarea"
              placeholder="Contoh: Berapa bulan waktu tunggu Anda untuk mendapatkan pekerjaan pertama?"
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Tipe Input *</label>
              <select
                className="form-input form-select"
                value={formData.question_type}
                onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
              >
                <option value="text">Teks Bebas (Uraian)</option>
                <option value="radio">Pilihan Tunggal (Radio)</option>
                <option value="checkbox">Pilihan Ganda (Checkbox)</option>
                <option value="scale">Skala Penilaian (1-5)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nomor Urut Tampil *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                required
              />
            </div>
          </div>

          {['radio', 'checkbox'].includes(formData.question_type) && (
            <div className="form-group">
              <label className="form-label">Pilihan Jawaban (Satu pilihan per baris) *</label>
              <textarea
                rows={4}
                className="form-input form-textarea"
                placeholder="Pilihan A&#10;Pilihan B&#10;Pilihan C"
                value={formData.optionsText}
                onChange={(e) => setFormData({ ...formData, optionsText: e.target.value })}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
              />
              <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                Wajib diisi oleh alumni (Required)
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Butir Soal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminTracerPage;
