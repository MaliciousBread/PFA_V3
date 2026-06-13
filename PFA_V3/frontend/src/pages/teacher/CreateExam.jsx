import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Tag, 
  Save, 
  ChevronDown, 
  ChevronUp,
  PlusCircle,
  X,
  FileUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BookOpen,
  CheckSquare
} from 'lucide-react';
import { Card, Button, Input } from '../../components/UI/Common';
import api from '../../services/api';
import './CreateExam.css';

const CreateExam = () => {
  const navigate = useNavigate();
  const subjectInputRef = useRef(null);
  const referenceInputRef = useRef(null);
  
  const [examInfo, setExamInfo] = useState({ title: '', subject: 'C++' });
  const [useFileUpload, setUseFileUpload] = useState(true);
  const [subjectFile, setSubjectFile] = useState(null);
  const [referenceFile, setReferenceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [questions, setQuestions] = useState([
    { 
      id: Date.now(), 
      text: '', 
      refAnswer: '', 
      keywords: [], 
      maxPoints: 5, 
      variants: [],
      expanded: true 
    }
  ]);

  const handleSaveExam = async () => {
    if (!examInfo.title) {
      setError('Veuillez donner un titre à l\'examen.');
      return;
    }

    if (useFileUpload && !subjectFile && !referenceFile) {
      setError('Veuillez uploader au moins le sujet ou le corrigé.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', examInfo.title);
      
      formData.append('subject', 'cpp');

      if (useFileUpload) {
        if (subjectFile) formData.append('subject_file', subjectFile);
        if (referenceFile) formData.append('reference_file', referenceFile);
      } else {
        // Manual entry logic...
      }

      await api.post('/exams/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving exam:', err);
      setError('Erreur lors de la création de l\'examen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-exam-wrapper fade-in">
      <div className="page-header">
        <div>
          <h2>Créer un nouvel Examen</h2>
          <p>Configurez le sujet et les références pour la correction automatique.</p>
        </div>
        <Button 
          icon={isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
          onClick={handleSaveExam}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer l\'examen'}
        </Button>
      </div>

      {error && (
        <div className="error-alert glass">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <Card title="Informations Générales" className="exam-info-card">
        <div className="form-row">
          <Input 
            label="Titre de l'examen" 
            placeholder="ex: Examen Final Algorithmique C++" 
            value={examInfo.title}
            onChange={(e) => setExamInfo({...examInfo, title: e.target.value})}
          />
          <div className="input-group">
            <label>Matière</label>
            <div className="input" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
              <span style={{ fontWeight: 600, color: '#6366f1' }}>C++</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(matière unique)</span>
            </div>
          </div>
        </div>

        <div className="creation-method-toggle">
          <button 
            className={`method-btn ${useFileUpload ? 'active' : ''}`}
            onClick={() => setUseFileUpload(true)}
          >
            <FileUp size={20} />
            <span>Upload Documents (Sujet & Corrigé)</span>
          </button>
          <button 
            className={`method-btn ${!useFileUpload ? 'active' : ''}`}
            onClick={() => setUseFileUpload(false)}
          >
            <PlusCircle size={20} />
            <span>Saisie Manuelle</span>
          </button>
        </div>
      </Card>

      {useFileUpload ? (
        <div className="dual-upload-section">
          <Card className="upload-zone-card glass">
            <div className="zone-header">
              <BookOpen size={20} />
              <h3>Sujet de l'examen</h3>
            </div>
            <div 
              className={`mini-drop-zone ${subjectFile ? 'has-file' : ''}`}
              onClick={() => subjectInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={subjectInputRef} 
                onChange={(e) => setSubjectFile(e.target.files[0])} 
                hidden 
                accept=".pdf,image/*"
              />
              {subjectFile ? (
                <div className="file-info-mini">
                  <CheckCircle2 size={32} className="success-icon" />
                  <div className="text-truncate">{subjectFile.name}</div>
                  <button className="remove-file-mini" onClick={(e) => {
                    e.stopPropagation();
                    setSubjectFile(null);
                  }}><X size={14} /></button>
                </div>
              ) : (
                <div className="prompt-mini">
                  <FileText size={32} />
                  <span>Cliquez pour uploader le sujet</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="upload-zone-card glass">
            <div className="zone-header">
              <CheckSquare size={20} />
              <h3>Corrigé / Références</h3>
            </div>
            <div 
              className={`mini-drop-zone ${referenceFile ? 'has-file' : ''}`}
              onClick={() => referenceInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={referenceInputRef} 
                onChange={(e) => setReferenceFile(e.target.files[0])} 
                hidden 
                accept=".pdf,image/*"
              />
              {referenceFile ? (
                <div className="file-info-mini">
                  <CheckCircle2 size={32} className="success-icon" />
                  <div className="text-truncate">{referenceFile.name}</div>
                  <button className="remove-file-mini" onClick={(e) => {
                    e.stopPropagation();
                    setReferenceFile(null);
                  }}><X size={14} /></button>
                </div>
              ) : (
                <div className="prompt-mini">
                  <FileText size={32} />
                  <span>Cliquez pour uploader le corrigé</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="questions-section">
          <div className="section-header">
            <h3>Questions</h3>
            <p>Saisie manuelle des questions et réponses de référence.</p>
          </div>
          <Card className="glass">
             <p className="placeholder-text">Fonctionnalité de saisie manuelle en cours de maintenance. Veuillez utiliser l'upload de documents.</p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CreateExam;
