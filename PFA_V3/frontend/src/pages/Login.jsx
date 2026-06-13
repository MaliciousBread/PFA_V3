import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  AlertCircle
} from 'lucide-react';
import { Button, Input } from '../components/UI/Common';
import { useAuth } from '../store/AuthContext';
import './Login.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // login function sends { username: identifier, password: password }
      // Our backend now supports email or username in the username field
      const user = await login(identifier, password);
      
      // Redirect based on role
      if (user.role === 'teacher') {
        navigate('/dashboard');
      } else {
        navigate('/my-results');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Identifiants invalides. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-brand">
          <div className="logo-icon-large">
            <GraduationCap size={48} />
          </div>
          <h1>AutoCorrect <span>AI</span></h1>
        </div>

        <div className="login-features">
          <div className="feature-item">
            <div className="feature-icon"><Zap size={20} /></div>
            <div className="feature-text">
              <h4>Instant Analysis</h4>
              <p>Get results in seconds using our state-of-the-art OCR & AI.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><ShieldCheck size={20} /></div>
            <div className="feature-text">
              <h4>Accurate Grading</h4>
              <p>Reference-based comparison ensures fair and precise scores.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><Globe size={20} /></div>
            <div className="feature-text">
              <h4>Spécialisé C++</h4>
              <p>Correction experte en C++ : syntaxe, POO, pointeurs, STL et plus.</p>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>© 2024 AutoCorrect AI System. All rights reserved.</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card glass">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Please enter your credentials to access your account.</p>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-with-icon">
              <Mail className="field-icon" size={18} />
              <Input 
                label="Email ou Nom d'utilisateur" 
                placeholder="prof@test.com ou prof" 
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <Input 
                label="Mot de passe" 
                placeholder="••••••••" 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Se souvenir de moi</span>
              </label>
              <a href="#" className="forgot-password">Mot de passe oublié ?</a>
            </div>

            <Button 
              fullWidth 
              size="lg" 
              type="submit" 
              icon={!isSubmitting && <ArrowRight size={18} />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </Button>

            <div className="login-register">
              <span>Pas encore de compte ?</span>
              <Link to="/register">Creer un compte</Link>
            </div>
          </form>

          <div className="login-social">
            <div className="divider"><span>Ou continuer avec</span></div>
            <div className="social-btns">
              <button className="social-btn glass">Google</button>
              <button className="social-btn glass">Microsoft</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
