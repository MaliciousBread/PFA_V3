import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Users,
  BookOpen
} from 'lucide-react';
import { Card, Button, Input, Badge } from '../../components/UI/Common';
import api from '../../services/api';
import './UploadCopies.css';

const UploadCopies = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [files, setFiles] = useState([]);
  const [exam, setExam] = useState('');
  const [student, setStudent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [isLoadingExams, setIsLoadingExams] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await api.get('/exams/');
        setExams(response.data);
      } catch (err) {
        console.error('Error fetching exams:', err);
      } finally {
        setIsLoadingExams(false);
      }
    };
    fetchExams();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      const type = file.type;
      return type === 'application/pdf' || type === 'image/jpeg' || type === 'image/png';
    });
    setFiles([...files, ...validFiles.map(f => ({ file: f, id: Math.random().toString(36).substr(2, 9), status: 'pending' }))]);
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !exam || !student) return;
    
    setUploadStatus('uploading');
    
    try {
        // Real upload logic
        for (const fileObj of files) {
            const formData = new FormData();
            formData.append('exam', exam);
            formData.append('student_name', student); 
            formData.append('scan_file', fileObj.file);
            
            await api.post('/copies/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        setUploadStatus('success');
        setFiles(files.map(f => ({ ...f, status: 'done' })));
    } catch (err) {
        console.error('Upload error:', err);
        setUploadStatus('error');
    }
  };

  return (
    <div className="upload-wrapper fade-in">
      <div className="page-header">
        <div>
          <h2>Uploader les Copies Scannées</h2>
          <p>Sélectionnez un examen et saisissez l'étudiant pour commencer l'analyse automatique.</p>
        </div>
      </div>

      <div className="upload-grid">
        <div className="upload-left">
          <Card title="Métadonnées de Sélection" className="metadata-card">
            <div className="input-group">
              <label><BookOpen size={16} /> Sélectionner l'Examen</label>
              <select className="input" value={exam} onChange={(e) => setExam(e.target.value)}>
                <option value="">Choisir un examen...</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
              {isLoadingExams && <div className="loading-small">Chargement des examens...</div>}
            </div>
            <div className="input-group">
              <label><Users size={16} /> Nom / ID de l'Étudiant</label>
              <Input 
                placeholder="Entrez le nom ou l'ID de l'étudiant" 
                value={student}
                onChange={(e) => setStudent(e.target.value)}
              />
            </div>
          </Card>

          <div 
            className={`drop-zone glass ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="drop-zone-content">
              <div className="upload-icon-circle">
                <Upload size={32} />
              </div>
              <h3>Glissez & Déposez les fichiers</h3>
              <p>Supporte PDF, JPEG, PNG</p>
              <div className="divider"><span>OU</span></div>
              <label className="btn btn-secondary">
                Parcourir les fichiers
                <input type="file" multiple hidden onChange={handleFileInput} accept=".pdf,.jpg,.jpeg,.png" />
              </label>
            </div>
          </div>
        </div>

        <div className="upload-right">
          <Card title="File d'attente" subtitle={`${files.length} fichiers sélectionnés`} className="queue-card">
            {files.length === 0 ? (
              <div className="empty-queue">
                <File size={48} className="empty-icon" />
                <p>Aucun fichier sélectionné</p>
              </div>
            ) : (
              <div className="file-list">
                {files.map((f) => (
                  <div key={f.id} className="file-item">
                    <div className="file-info">
                      <File size={20} className="file-icon" />
                      <div className="file-details">
                        <span className="file-name">{f.file.name}</span>
                        <span className="file-size">{(f.file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <div className="file-actions">
                      {f.status === 'pending' && (
                        <button className="remove-btn" onClick={() => removeFile(f.id)}>
                          <X size={16} />
                        </button>
                      )}
                      {f.status === 'uploading' && <Loader2 size={16} className="spin" />}
                      {f.status === 'done' && <CheckCircle2 size={16} className="success-icon" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="queue-footer">
              <Button 
                fullWidth 
                disabled={files.length === 0 || !exam || !student || uploadStatus === 'uploading'}
                onClick={handleUpload}
                icon={uploadStatus === 'uploading' ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
              >
                {uploadStatus === 'uploading' ? 'Traitement en cours...' : 'Lancer l\'Analyse'}
              </Button>
              
              {uploadStatus === 'success' && (
                <div className="status-banner success fade-in">
                  <CheckCircle2 size={16} />
                  <span>Upload terminé avec succès !</span>
                  <Button 
                    variant="primary" 
                    className="mt-2"
                    onClick={() => navigate(`/dashboard`)}
                  >
                    Aller au Tableau de Bord
                  </Button>
                </div>
              )}
              {uploadStatus === 'error' && (
                <div className="status-banner error fade-in">
                  <AlertCircle size={16} />
                  <span>Erreur lors de l'upload.</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UploadCopies;
