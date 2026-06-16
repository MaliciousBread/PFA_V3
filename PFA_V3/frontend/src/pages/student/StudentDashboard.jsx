import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Award, 
  Clock, 
  ChevronRight, 
  MessageCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, Badge } from '../../components/UI/Common';
import api from '../../services/api';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCopy, setSelectedCopy] = useState(null);

  // 1. Récupération des vraies données depuis Django
  useEffect(() => {
    const fetchMyCopies = async () => {
      try {
        const response = await api.get('/copies/');
        // Le backend filtre automatiquement pour ne renvoyer que les copies de l'étudiant connecté
        setCopies(response.data);
      } catch (err) {
        console.error('Error fetching copies:', err);
        setError('Impossible de charger vos résultats.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyCopies();
  }, []);

  // 2. Calcul dynamique de la moyenne de l'étudiant (uniquement sur les copies terminées)
  const completedCopies = copies.filter(c => c.status === 'done');
  const avgScore = completedCopies.length > 0 
    ? (completedCopies.reduce((acc, c) => acc + (c.grade_out_of_20 || 0), 0) / completedCopies.length).toFixed(2)
    : 0;

  if (loading) {
    return (
      <div className="student-dashboard fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Loader2 className="animate-spin" size={48} color="#6366f1" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-dashboard fade-in">
        <div className="error-screen glass" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto', marginBottom: '1rem' }} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard fade-in">
      <div className="page-header">
        <div>
          <h2>Mes Résultats</h2>
          <p>Consultez vos notes et les retours détaillés de vos professeurs.</p>
        </div>
        <div className="student-stats">
          <div className="stat-pill glass">
            <Award size={18} />
            <span>Moyenne Générale : {avgScore}/20</span>
          </div>
        </div>
      </div>

      {/* VUE 1 : LISTE DES EXAMENS */}
      {!selectedCopy ? (
        <div className="exam-list-grid">
          {copies.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              Aucun examen trouvé.
            </div>
          ) : (
            copies.map(copy => (
              <Card 
                key={copy.id} 
                className={`exam-result-card ${copy.status === 'done' ? 'glass-hover' : 'glass'}`} 
                onClick={() => copy.status === 'done' && setSelectedCopy(copy)}
                style={{ 
                  cursor: copy.status === 'done' ? 'pointer' : 'not-allowed', 
                  opacity: copy.status === 'done' ? 1 : 0.8 
                }}
              >
                <div className="exam-card-header">
                  <div className="exam-icon-box" style={{ backgroundColor: copy.status === 'done' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }}>
                    <FileCheck size={24} color={copy.status === 'done' ? '#10b981' : '#f59e0b'} />
                  </div>
                  <Badge status={copy.status === 'done' ? 'success' : 'warning'}>
                    {copy.status === 'done' ? 'Corrigé' : 'En attente'}
                  </Badge>
                </div>
                
                <div className="exam-card-body">
                  <h3>{copy.exam_title || `Examen #${copy.exam}`}</h3>
                  <div className="exam-meta">
                    <Clock size={14} />
                    <span>{new Date(copy.uploaded_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  
                  {copy.status === 'done' && (
                    <div className="exam-score-main">
                      <span className="score">{copy.grade_out_of_20}</span>
                      <span className="max">/ 20</span>
                    </div>
                  )}
                </div>

                <div className="exam-card-footer">
                  {copy.status === 'done' ? (
                    <span className="view-link" style={{ color: '#6366f1' }}>Voir les détails <ChevronRight size={16} /></span>
                  ) : (
                    <span className="view-link" style={{ color: '#94a3b8' }}>Correction en cours...</span>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (

      /* VUE 2 : DÉTAILS D'UNE COPIE SPÉCIFIQUE */
        <div className="exam-detail-view fade-in">
          <button className="back-btn" onClick={() => setSelectedCopy(null)}>
            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Retour aux examens
          </button>

          <div className="detail-header">
            <Card className="summary-card">
              <div className="summary-layout">
                <div className="summary-text">
                  <h3>{selectedCopy.exam_title || `Examen #${selectedCopy.exam}`}</h3>
                  <p className="overall-feedback">Voici le détail de vos points par question validé par le professeur.</p>
                </div>
                <div className="summary-score">
                  <div className="score-circle">
                    <span className="val">{selectedCopy.grade_out_of_20}</span>
                    <span className="max">/ 20</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="questions-breakdown">
            <h4>Détail par Question</h4>
            <div className="question-cards">
              {!selectedCopy.answers || selectedCopy.answers.length === 0 ? (
                <p style={{ color: '#64748b' }}>Aucun détail disponible pour cette copie.</p>
              ) : (
                selectedCopy.answers.map((ans, i) => (
                  <Card key={ans.id} className="q-feedback-card">
                    <div className="q-feedback-header">
                      <div className="q-info">
                        <span className="q-num">Q{i + 1}</span>
                        <span className="q-title">Question {i + 1}</span>
                      </div>
                      <div className="q-score">
                        {ans.final_score} pts
                      </div>
                    </div>
                    <div className="q-feedback-body">
                      <MessageCircle size={16} />
                      {/* Affichage du feedback généré par l'IA */}
                      <p>{ans.feedback || 'Aucun commentaire.'}</p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;