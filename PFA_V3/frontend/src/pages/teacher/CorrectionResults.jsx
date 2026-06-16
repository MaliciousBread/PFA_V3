import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  CheckCircle,
  XCircle,
  Edit3,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Badge, Input } from '../../components/UI/Common';
import api from '../../services/api';
import './CorrectionResults.css';

const CorrectionResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copyData, setCopyData] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await api.get(`/copies/${id}/results/`);
        setCopyData(response.data);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Impossible de charger les résultats de cette copie.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  const updateManualScore = (answerId, score) => {
    const updatedAnswers = copyData.answers.map(a =>
      a.id === answerId ? { ...a, teacher_override_score: score === '' ? null : parseFloat(score) } : a
    );
    setCopyData({ ...copyData, answers: updatedAnswers });
  };

  const handleSaveOverrides = async () => {
    setSaving(true);
    try {
      const currentAnswer = copyData.answers[currentQ];
      await api.patch(`/answers/${currentAnswer.id}/override/`, {
        teacher_override_score: currentAnswer.teacher_override_score
      });
      // Optionally show success toast
    } catch (err) {
      console.error('Error saving override:', err);
      alert('Erreur lors de l\'enregistrement de la note.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="animate-spin" size={48} />
        <p>Chargement des résultats d'analyse...</p>
      </div>
    );
  }

  if (error || !copyData) {
    return (
      <div className="error-screen glass">
        <AlertCircle size={48} />
        <p>{error || 'Une erreur est survenue.'}</p>
        <Button onClick={() => navigate('/dashboard')}>Retour au Dashboard</Button>
      </div>
    );
  }

  const answers = copyData.answers || [];
  const currentAnswer = answers[currentQ];
  const liveRawScore = answers.reduce((acc, curr) => acc + (curr.teacher_override_score ?? curr.score ?? 0), 0);
  const liveDisplayScore = Math.min(liveRawScore, 20).toFixed(1);

  return (
    <div className="correction-wrapper fade-in">
      <div className="page-header">
        <div className="header-info">
          <Badge status={copyData.status === 'done' ? 'success' : 'warning'}>
            {copyData.status === 'done' ? 'Analyse Terminée' : 'Analyse en cours...'}
          </Badge>
          <h2>Résultats de Correction : {copyData.student_name}</h2>
          <p>Examen : {copyData.exam_title} | Uploadé le : {new Date(copyData.uploaded_at).toLocaleString()}</p>
        </div>
        <div className="header-summary card glass">
          <div className="summary-item">
            <span>Score Total</span>
            <div className="score-val">
              {liveDisplayScore}
              <span className="max">/ 20</span>
            </div>
          </div>
          <Button
            icon={saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            onClick={handleSaveOverrides}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Valider la Note'}
          </Button>
        </div>
      </div>

      <div className="split-view">
        <div className="view-left glass">
          <div className="image-viewer-header">
            <h3>Copie Scannée</h3>
            <div className="viewer-controls">
              <button className="icon-btn"><ZoomIn size={18} /></button>
              <button className="icon-btn"><ZoomOut size={18} /></button>
              <button className="icon-btn"><Maximize2 size={18} /></button>
            </div>
          </div>
          <div className="image-container">
            {copyData.scan_file ? (
              <img src={copyData.scan_file} alt="Copie Étudiant" className="scan-image" />
            ) : (
              <div className="mock-scan-image">
                <p className="image-placeholder-text">APERÇU DE L'IMAGE</p>
              </div>
            )}
          </div>
        </div>

        <div className="view-right">
          <div className="results-navigation">
            <h3>Détails par Question</h3>
            <div className="nav-btns">
              <button
                className="icon-btn"
                disabled={currentQ === 0}
                onClick={() => setCurrentQ(currentQ - 1)}
              >
                <ChevronLeft size={20} />
              </button>
              <span>{currentQ + 1} / {answers.length}</span>
              <button
                className="icon-btn"
                disabled={currentQ === answers.length - 1}
                onClick={() => setCurrentQ(currentQ + 1)}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {currentAnswer ? (
            <div className="question-result-card glass">
              <div className="q-header">
                <div className="q-tag">Question {currentAnswer.question_number || (currentQ + 1)}</div>
                <div className="q-text">{currentAnswer.question_text || 'Chargement de la question...'}</div>
              </div>

              <div className="result-section">
                <div className="section-label">Texte extrait par OCR</div>
                <div className="ocr-content">
                  {currentAnswer.raw_text || <span className="placeholder">Aucun texte détecté</span>}
                </div>
              </div>

              <div className="result-section">
                <div className="section-label">Analyse IA & Feedback</div>
                <div className="feedback-content">
                  <div className="feedback-icon">
                    <MessageSquare size={18} />
                  </div>
                  <p>{currentAnswer.feedback || 'Analyse en cours...'}</p>
                </div>
              </div>

              <div className="score-section">
                <div className="auto-score">
                  <span className="label">Note IA</span>
                  <span className="val">{(currentAnswer.score || 0).toFixed(1)} / {currentAnswer.max_points || 5}</span>
                </div>
                <div className="manual-score-input">
                  <span className="label">Ajuster la note</span>
                  <div className="input-with-max">
                    <input
                      type="number"
                      className="input"
                      step="0.5"
                      max={currentAnswer.max_points || 5}
                      value={currentAnswer.teacher_override_score ?? ''}
                      placeholder={currentAnswer.score ?? 0}
                      onChange={(e) => updateManualScore(currentAnswer.id, e.target.value)}
                    />
                    <span className="max-tag">/ {currentAnswer.max_points || 5}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state glass">
              <AlertCircle size={32} />
              <p>Aucune réponse trouvée pour cette copie.</p>
            </div>
          )}

          <div className="quick-actions">
            <Button variant="secondary" fullWidth icon={<Edit3 size={16} />}>Ajouter un Commentaire</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrectionResults;
