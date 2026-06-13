import React, { useState } from 'react';
import { 
  FileCheck, 
  Award, 
  Clock, 
  ChevronRight, 
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { Card, Badge, Button } from '../../components/UI/Common';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [selectedExam, setSelectedExam] = useState(null);

  const exams = [
    { 
      id: 1, 
      title: 'C++ Advanced Midterm', 
      date: 'April 20, 2024', 
      score: 18.5, 
      maxScore: 20,
      feedback: "Great work! You have a deep understanding of polymorphism.",
      questions: [
        { q: "Concept of polymorphism", score: 4.5, max: 5, feedback: "Excellent explanation of virtual functions." },
        { q: "Implement 'Car' class", score: 5, max: 5, feedback: "Perfect implementation." },
        { q: "Memory management", score: 9, max: 10, feedback: "Small error in the destructor syntax." }
      ]
    },
    { 
      id: 2, 
      title: 'C++ STL & Templates Quiz', 
      date: 'April 22, 2024', 
      score: 15, 
      maxScore: 20,
      feedback: "Good attempt. Practice more on template specialization.",
      questions: [
        { q: "Template specialization", score: 3, max: 5, feedback: "You missed the partial specialization case." },
        { q: "STL containers (vector, map)", score: 5, max: 5, feedback: "Correct." },
        { q: "Iterators and algorithms", score: 7, max: 10, feedback: "Missing explanation of std::transform." }
      ]
    }
  ];

  return (
    <div className="student-dashboard fade-in">
      <div className="page-header">
        <div>
          <h2>My Results</h2>
          <p>View your performance and detailed feedback from the AI.</p>
        </div>
        <div className="student-stats">
          <div className="stat-pill glass">
            <Award size={18} />
            <span>Avg: 16.75/20</span>
          </div>
        </div>
      </div>

      {!selectedExam ? (
        <div className="exam-list-grid">
          {exams.map(exam => (
            <Card key={exam.id} className="exam-result-card glass-hover" onClick={() => setSelectedExam(exam)}>
              <div className="exam-card-header">
                <div className="exam-icon-box">
                  <FileCheck size={24} />
                </div>
                <Badge status="success">Completed</Badge>
              </div>
              <div className="exam-card-body">
                <h3>{exam.title}</h3>
                <div className="exam-meta">
                  <Clock size={14} />
                  <span>{exam.date}</span>
                </div>
                <div className="exam-score-main">
                  <span className="score">{exam.score}</span>
                  <span className="max">/ {exam.maxScore}</span>
                </div>
              </div>
              <div className="exam-card-footer">
                <span className="view-link">View Details <ChevronRight size={16} /></span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="exam-detail-view fade-in">
          <button className="back-btn" onClick={() => setSelectedExam(null)}>
            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to Exams
          </button>

          <div className="detail-header">
            <Card className="summary-card">
              <div className="summary-layout">
                <div className="summary-text">
                  <h3>{selectedExam.title}</h3>
                  <p className="overall-feedback">"{selectedExam.feedback}"</p>
                </div>
                <div className="summary-score">
                  <div className="score-circle">
                    <span className="val">{selectedExam.score}</span>
                    <span className="max">/ {selectedExam.maxScore}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="questions-breakdown">
            <h4>Question Breakdown</h4>
            <div className="question-cards">
              {selectedExam.questions.map((q, i) => (
                <Card key={i} className="q-feedback-card">
                  <div className="q-feedback-header">
                    <div className="q-info">
                      <span className="q-num">Q{i + 1}</span>
                      <span className="q-title">{q.q}</span>
                    </div>
                    <div className="q-score">
                      {q.score} / {q.max}
                    </div>
                  </div>
                  <div className="q-feedback-body">
                    <MessageCircle size={16} />
                    <p>{q.feedback}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
