import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { BookOpen } from 'lucide-react';

const StudentDashboard = () => {
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCopies = async () => {
      try {
        const { data } = await api.get('/copies/');
        setCopies(data);
      } catch (error) {
        console.error('Failed to fetch results', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCopies();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Mes Résultats</h1>
        <p className="text-slate-500 mt-1">Consultez vos notes et retours de correction</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {copies.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-xl text-center border border-slate-100">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Aucune copie disponible</h3>
            <p className="text-slate-500 mt-1">Vos résultats apparaîtront ici une fois corrigés.</p>
          </div>
        ) : (
          copies.map((copy) => {
            const totalScore = copy.answers.reduce((sum, ans) => sum + (ans.final_score || 0), 0);
            return (
              <div key={copy.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{copy.exam_title}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Corrigé le {new Date(copy.uploaded_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-xl">
                    {totalScore} pts
                  </div>
                </div>
                
                <div className="space-y-4 mt-6 border-t border-slate-100 pt-6">
                  <h4 className="font-semibold text-slate-800">Détails de correction</h4>
                  {copy.answers.map((answer, idx) => (
                    <div key={answer.id} className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-slate-700">Question {idx + 1}</span>
                        <span className="text-sm font-bold text-slate-900">{answer.final_score} pts</span>
                      </div>
                      {answer.feedback && (
                        <p className="text-sm text-slate-600 italic">"{answer.feedback}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
