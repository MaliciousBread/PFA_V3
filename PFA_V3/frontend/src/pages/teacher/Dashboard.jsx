import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  CheckCircle,
  TrendingUp,
  Clock,
  ExternalLink,
  Loader2,
  Trash2 // <-- Nouvel icône pour la suppression
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, Badge, Button } from '../../components/UI/Common';
import api from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [recentCopies, setRecentCopies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Nouvel état pour stocker les vraies statistiques du backend
  const [dashboardStats, setDashboardStats] = useState({
    total_copies: 0,
    average_score: 0,
    success_rate: 0,
    distribution: [
      { name: '0-5', count: 0 },
      { name: '5-10', count: 0 },
      { name: '10-15', count: 0 },
      { name: '15-20', count: 0 },
    ]
  });

  const COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#10b981'];

  // Fonction pour recharger les données
  const fetchDashboardData = async () => {
    try {
      const [examsRes, copiesRes, statsRes] = await Promise.all([
        api.get('/exams/'),
        api.get('/copies/'),
        api.get('/dashboard/stats/') // <-- Appel de notre nouvelle API !
      ]);
      setExams(examsRes.data);
      setRecentCopies(copiesRes.data);
      setDashboardStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fonction pour supprimer une copie
  const handleDelete = async (copyId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette copie ?")) return;
    try {
      await api.delete(`/copies/${copyId}/`);
      // Rafraîchit les stats et la table après la suppression
      fetchDashboardData();
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Impossible de supprimer la copie.");
    }
  };

  // Injection des vraies valeurs dans les cartes
  const stats = [
    { label: 'Total Copies', value: dashboardStats.total_copies.toString(), icon: <FileText size={24} />, trend: '', color: '#6366f1' },
    { label: 'Score Moyen', value: `${dashboardStats.average_score}/20`, icon: <TrendingUp size={24} />, trend: '', color: '#10b981' },
    { label: 'Taux de Réussite', value: `${dashboardStats.success_rate}%`, icon: <CheckCircle size={24} />, trend: '', color: '#f59e0b' },
  ];

  return (
    <div className="dashboard-wrapper fade-in">
      <div className="welcome-section">
        <h2>Bienvenue, Professeur</h2>
        <p>Voici un aperçu de vos examens et des copies analysées.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <Card key={i} className="stat-card">
            <div className="stat-content">
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-info">
                <span className="stat-label">{stat.label}</span>
                <div className="stat-value-row">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-trend">{stat.trend}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="dashboard-main-grid">
        <Card title="Distribution des Notes" subtitle="Performance globale" className="chart-card">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardStats.distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {dashboardStats.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Copies Récemment Analysées" subtitle="Suivez les résultats de vos étudiants" className="table-card">
          <div className="table-wrapper">
            {loading ? (
              <div className="loading-state">
                <Loader2 className="animate-spin" size={32} />
                <span>Chargement des données...</span>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Examen</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCopies.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Aucune copie trouvée.
                      </td>
                    </tr>
                  ) : (
                    recentCopies.map(copy => (
                      <tr key={copy.id}>
                        <td>
                          <div className="exam-cell">
                            <span className="exam-title">{copy.student_name || `Étudiant #${copy.student}`}</span>
                            <span className="exam-date">{new Date(copy.uploaded_at || copy.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td><Badge variant="outline">{copy.exam_title || `Examen #${copy.exam}`}</Badge></td>
                        <td>
                          <Badge status={
                            copy.status === 'done' ? 'success' :
                              copy.status === 'processing' ? 'warning' :
                                copy.status === 'error' ? 'error' : 'default'
                          }>
                            {copy.status === 'done' ? 'Corrigé' :
                              copy.status === 'processing' ? 'Analyse...' :
                                copy.status === 'pending' ? 'En attente' : 'Erreur'}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<ExternalLink size={14} />}
                              onClick={() => navigate(`/copies/${copy.id}/results`)}
                            >
                              Voir
                            </Button>
                            {/* Bouton de suppression */}
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<Trash2 size={14} />}
                              onClick={() => handleDelete(copy.id)}
                              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                            >
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;