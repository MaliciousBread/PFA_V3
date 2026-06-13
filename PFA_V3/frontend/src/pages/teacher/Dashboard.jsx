import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  TrendingUp,
  Clock,
  ExternalLink,
  Loader2
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

  const stats = [
    { label: 'Total Copies', value: '0', icon: <FileText size={24} />, trend: '+0%', color: '#6366f1' },
    { label: 'Score Moyen', value: '0/20', icon: <TrendingUp size={24} />, trend: '+0%', color: '#10b981' },
    { label: 'Taux de Réussite', value: '0%', icon: <CheckCircle size={24} />, trend: '+0%', color: '#f59e0b' },
  ];

  const chartData = [
    { name: '0-5', count: 0 },
    { name: '5-10', count: 0 },
    { name: '10-15', count: 0 },
    { name: '15-20', count: 0 },
  ];

  const COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#10b981'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, copiesRes] = await Promise.all([
          api.get('/exams/'),
          api.get('/copies/')
        ]);
        setExams(examsRes.data);
        setRecentCopies(copiesRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
              <BarChart data={chartData}>
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
                  {chartData.map((entry, index) => (
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
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCopies.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>
                                Aucune copie trouvée.
                            </td>
                        </tr>
                    ) : (
                        recentCopies.map(copy => (
                          <tr key={copy.id}>
                            <td>
                              <div className="exam-cell">
                                <span className="exam-title">{copy.student_name}</span>
                                <span className="exam-date">{new Date(copy.uploaded_at).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td><Badge variant="outline">{copy.exam_title}</Badge></td>
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
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                icon={<ExternalLink size={14} />}
                                onClick={() => navigate(`/copies/${copy.id}/results`)}
                              >
                                Voir
                              </Button>
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
