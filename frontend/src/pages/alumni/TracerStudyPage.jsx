import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import Spinner from '../../components/ui/Spinner';

const TracerStudyPage = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const loadQuestionsAndAnswers = async () => {
      try {
        const [qRes, aRes] = await Promise.all([
          api.get('/tracer-questions'),
          api.get('/tracer-answers/my').catch(() => ({ data: { answers: [] } })),
        ]);

        const questionList = qRes.data?.questions || qRes.data?.data || (Array.isArray(qRes.data) ? qRes.data : []);
        setQuestions(Array.isArray(questionList) ? questionList : []);

        const myAnswers = aRes.data?.answers || [];
        if (myAnswers.length > 0) {
          setAlreadySubmitted(true);
          const initialAnswers = {};
          myAnswers.forEach((ans) => {
            initialAnswers[ans.question_id] = ans.answer_value;
          });
          setAnswers(initialAnswers);
        }
      } catch (err) {
        console.error('Gagal mengambil data kuesioner:', err);
        toast.error('Gagal memuat kuesioner tracer study.');
      } finally {
        setLoading(false);
      }
    };

    loadQuestionsAndAnswers();
  }, [toast]);

  const handleTextChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleCheckboxChange = (questionId, option) => {
    const current = answers[questionId] ? answers[questionId].split(', ') : [];
    let updated;
    if (current.includes(option)) {
      updated = current.filter((item) => item !== option);
    } else {
      updated = [...current, option];
    }
    setAnswers((prev) => ({
      ...prev,
      [questionId]: updated.join(', '),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check required fields
    for (const q of questions) {
      if (q.is_required && (!answers[q.id] || answers[q.id].trim() === '')) {
        toast.warning(`Pertanyaan wajib: "${q.question_text}" belum dijawab!`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payloadAnswers = Object.entries(answers).map(([qId, val]) => ({
        question_id: parseInt(qId),
        answer_value: String(val),
      }));

      await api.post('/tracer-answers', { answers: payloadAnswers });
      toast.success('Jawaban kuesioner tracer study berhasil disimpan! Terima kasih.');
      setAlreadySubmitted(true);
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan jawaban. Periksa koneksi Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner text="Memuat kuesioner tracer study..." />;
  }

  // Calculate progress
  const answeredCount = questions.filter((q) => answers[q.id] && answers[q.id].trim() !== '').length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Kuesioner Tracer Study Alumni
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              SMA Negeri 1 Talang Padang — Pengumpulan data penelusuran lulusan untuk peningkatan mutu pembelajaran dan akreditasi sekolah.
            </p>
          </div>

          {alreadySubmitted && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-secondary btn-sm"
            >
              ✏️ Ubah / Perbarui Jawaban
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            <span>Progres Pengisian: {answeredCount} dari {questions.length} terjawab</span>
            <span style={{ fontWeight: 700, color: progressPercent === 100 ? '#34d399' : '#818cf8' }}>
              {progressPercent}%
            </span>
          </div>
          <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: progressPercent === 100 ? '#10b981' : 'linear-gradient(90deg, #6366f1, #a855f7)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {alreadySubmitted && !isEditing ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>
              Kuesioner Anda Telah Disimpan
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: '500px', margin: '0.5rem auto 1.5rem' }}>
              Terima kasih atas partisipasi Anda dalam survei tracer study SMAN 1 Talang Padang. Jawaban Anda tersimpan dengan aman di database sekolah.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-primary"
            >
              Tinjau atau Perbarui Jawaban
            </button>
          </div>

          {/* Read-only view of answers */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#cbd5e1' }}>
              Ringkasan Tanggapan Anda:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {questions.map((q, idx) => (
                <div key={q.id} style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600 }}>
                    {idx + 1}. {q.question_text}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#f1f5f9', marginTop: '0.35rem', fontWeight: 500 }}>
                    {answers[q.id] || <span style={{ color: '#64748b', fontStyle: 'italic' }}>Tidak dijawab</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q, idx) => {
            const rawOptions = typeof q.options === 'string' ? JSON.parse(q.options || '[]') : (q.options || []);

            return (
              <div key={q.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 800, color: '#818cf8', fontSize: '1rem' }}>{idx + 1}.</span>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}>
                      {q.question_text}
                      {q.is_required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                    </label>
                  </div>
                </div>

                {/* Question Types */}
                {q.question_type === 'text' && (
                  <textarea
                    rows={3}
                    className="form-input form-textarea"
                    placeholder="Tuliskan jawaban Anda secara rinci..."
                    value={answers[q.id] || ''}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                  />
                )}

                {q.question_type === 'radio' && (
                  <div className="form-radio-group">
                    {rawOptions.map((opt, oIdx) => (
                      <label key={oIdx} className="form-radio-item">
                        <input
                          type="radio"
                          name={`question_${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                        />
                        <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.question_type === 'checkbox' && (
                  <div className="form-radio-group">
                    {rawOptions.map((opt, oIdx) => {
                      const checked = (answers[q.id] || '').split(', ').includes(opt);
                      return (
                        <label key={oIdx} className="form-checkbox-item">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleCheckboxChange(q.id, opt)}
                          />
                          <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {q.question_type === 'scale' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                      <span>Sangat Tidak Setuju (1)</span>
                      <span>Sangat Setuju (5)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-around', background: '#0f172a', padding: '0.75rem', borderRadius: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <label
                          key={val}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="radio"
                            name={`scale_${q.id}`}
                            value={String(val)}
                            checked={String(answers[q.id]) === String(val)}
                            onChange={(e) => handleTextChange(q.id, e.target.value)}
                            style={{ accentColor: '#6366f1', width: '18px', height: '18px' }}
                          />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan Jawaban...' : 'Kirim Jawaban Tracer Study 🚀'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TracerStudyPage;
