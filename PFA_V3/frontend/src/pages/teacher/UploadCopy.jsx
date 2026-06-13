import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X, CheckCircle, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const UploadCopy = () => {
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, done
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      const examsRes = await api.get('/exams/');
      setExams(examsRes.data);
      
      const preselectedExam = searchParams.get('exam');
      if (preselectedExam) setSelectedExam(preselectedExam);
      
      // In a real app, fetch students list, here we mock it or fetch if API allows
      // Assuming GET /auth/users/ returns students (not implemented in backend, so mocking)
      setStudents([{id: 2, username: 'eleve1', first_name: 'Jean', last_name: 'Dupont'}]);
    };
    fetchData();
  }, [searchParams]);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'], 'application/pdf': ['.pdf']},
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file || !selectedExam || !selectedStudent) return;
    
    setStatus('uploading');
    const formData = new FormData();
    formData.append('scan_file', file);
    formData.append('exam', selectedExam);
    formData.append('student', selectedStudent);

    try {
      const { data: copy } = await api.post('/copies/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setStatus('processing');
      await api.post(`/copies/${copy.id}/process/`);
      
      // Simulating polling
      const poll = setInterval(async () => {
        const { data: updatedCopy } = await api.get(`/copies/${copy.id}/`);
        if (updatedCopy.status === 'done' || updatedCopy.status === 'error') {
          clearInterval(poll);
          setStatus('done');
        }
      }, 3000);
      
    } catch (error) {
      console.error('Upload failed', error);
      setStatus('idle');
      alert("Erreur lors de l'envoi");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Uploader une Copie</h1>
        <p className="text-slate-500 mt-1">Sélectionnez l'examen et l'étudiant pour procéder</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Examen</label>
            <select
              value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200"
            >
              <option value="">Sélectionner un examen...</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Étudiant</label>
            <select
              value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200"
            >
              <option value="">Sélectionner un étudiant...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Fichier scanné (PDF, JPG, PNG)</label>
          {!file ? (
            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}`}>
              <input {...getInputProps()} />
              <UploadCloud size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 font-medium">Glissez-déposez le fichier ici, ou cliquez pour sélectionner</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <FileIcon size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 p-2">
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleUpload}
            disabled={!file || !selectedExam || !selectedStudent || status !== 'idle'}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            {status === 'idle' && 'Envoyer et Corriger'}
            {status === 'uploading' && <><Loader2 size={18} className="animate-spin" /> Envoi en cours...</>}
            {status === 'processing' && <><Loader2 size={18} className="animate-spin" /> Correction par l'IA...</>}
            {status === 'done' && <><CheckCircle size={18} /> Correction terminée !</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadCopy;
