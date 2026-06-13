import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { Save, AlertTriangle, Image as ImageIcon } from 'lucide-react';

const ResultsViewer = () => {
  const { id } = useParams();
  const [copy, setCopy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCopy = async () => {
      try {
        const { data } = await api.get(`/copies/${id}/results/`);
        setCopy(data);
      } catch (error) {
        console.error('Failed to fetch copy results', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCopy();
  }, [id]);

  const handleScoreOverride = async (answerId, newScore) => {
    try {
      await api.patch(`/copies/answers/${answerId}/override/`, { teacher_override_score: newScore });
      
      // Update local state
      const newAnswers = copy.answers.map(ans => 
        ans.id === answerId ? { ...ans, teacher_override_score: newScore, final_score: newScore } : ans
      );
      setCopy({ ...copy, answers: newAnswers });
    } catch (e) {
      alert("Erreur lors de la modification du score");
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!copy) return <div className="p-8 text-center text-red-500">Copie introuvable</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Left: Document Viewer */}
      <div className="w-1/2 bg-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="bg-slate-900 px-4 py-3 flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} />
            <span className="font-medium text-sm">Document original</span>
          </div>
          <span className="text-xs">Scan: {copy.scan_file?.split('/').pop() || 'N/A'}</span>
        </div>
        <div className="flex-1 bg-slate-800 p-4 overflow-auto flex justify-center items-center">
          {copy.scan_file ? (
            <img src={copy.scan_file} alt="Copie scannée" className="max-w-full h-auto object-contain bg-white" />
          ) : (
            <div className="text-slate-500">Aperçu indisponible</div>
          )}
        </div>
      </div>

      {/* Right: Correction Breakdown */}
      <div className="w-1/2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{copy.student_name}</h2>
            <p className="text-sm text-slate-500">{copy.exam_title}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {copy.answers.reduce((acc, a) => acc + (a.final_score || 0), 0)} pts
            </div>
            <div className="text-xs text-slate-500 font-medium">Score Total</div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {copy.answers.map((ans, idx) => (
            <div key={ans.id} className="border border-slate-100 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-100">
                <span className="font-bold text-slate-700">Question {idx + 1}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">Score IA: {ans.score}</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      step="0.5" 
                      defaultValue={ans.final_score}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val !== ans.final_score && !isNaN(val)) handleScoreOverride(ans.id, val);
                      }}
                      className="w-16 px-2 py-1 text-center font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Save size={16} className="text-slate-400" />
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400 mb-1">Texte extrait (OCR)</h4>
                  <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 font-mono">
                    {ans.raw_text || <span className="italic text-slate-400">Texte illisible ou vide</span>}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-500" /> Retour IA
                  </h4>
                  <p className="text-sm text-slate-800">{ans.feedback}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsViewer;
