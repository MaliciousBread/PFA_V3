import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, GraduationCap } from 'lucide-react';
import { Button, Input } from '../components/UI/Common';
import { useAuth } from '../store/AuthContext';
import './Register.css';

const Register = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'student',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const updateField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        username: form.username,
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        role: form.role,
        password: form.password,
      });

      if (user.role === 'teacher') {
        navigate('/dashboard');
      } else {
        navigate('/my-results');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('Inscription impossible. Verifie les champs et reessaie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-left">
        <div className="register-brand">
          <div className="logo-icon-large">
            <GraduationCap size={48} />
          </div>
          <h1>AutoCorrect <span>AI</span></h1>
        </div>

        <div className="register-side-text">
          <h2>Creer un compte</h2>
          <p>Choisis ton role et commence a corriger ou consulter tes resultats.</p>
        </div>

        <div className="register-footer">
          <p>© 2024 AutoCorrect AI System. All rights reserved.</p>
        </div>
      </div>

      <div className="register-right">
        <div className="register-card glass">
          <div className="register-header">
            <h2>Inscription</h2>
            <p>Remplis les informations ci-dessous.</p>
          </div>

          {error && (
            <div className="register-error">
              <span>{error}</span>
            </div>
          )}

          <form className="register-form" onSubmit={handleRegister}>
            <div className="input-with-icon">
              <User className="field-icon" size={18} />
              <Input
                label="Nom d'utilisateur"
                placeholder="ex: prof_amine"
                type="text"
                required
                value={form.username}
                onChange={updateField('username')}
                disabled={isSubmitting}
              />
            </div>

            <div className="input-with-icon">
              <Mail className="field-icon" size={18} />
              <Input
                label="Email"
                placeholder="ex: prof@test.com"
                type="email"
                value={form.email}
                onChange={updateField('email')}
                disabled={isSubmitting}
              />
            </div>

            <div className="register-grid">
              <Input
                label="Prenom"
                placeholder="Prenom"
                type="text"
                value={form.firstName}
                onChange={updateField('firstName')}
                disabled={isSubmitting}
              />
              <Input
                label="Nom"
                placeholder="Nom"
                type="text"
                value={form.lastName}
                onChange={updateField('lastName')}
                disabled={isSubmitting}
              />
            </div>

            <div className="select-group">
              <label>Role</label>
              <select value={form.role} onChange={updateField('role')} disabled={isSubmitting}>
                <option value="teacher">Enseignant</option>
                <option value="student">Etudiant</option>
              </select>
            </div>

            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <Input
                label="Mot de passe"
                placeholder="••••••••"
                type="password"
                required
                value={form.password}
                onChange={updateField('password')}
                disabled={isSubmitting}
              />
            </div>

            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <Input
                label="Confirmer le mot de passe"
                placeholder="••••••••"
                type="password"
                required
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                disabled={isSubmitting}
              />
            </div>

            <Button
              fullWidth
              size="lg"
              type="submit"
              icon={!isSubmitting && <ArrowRight size={18} />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creation...' : 'Creer un compte'}
            </Button>

            <div className="register-login">
              <span>Deja un compte ?</span>
              <Link to="/login">Se connecter</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
