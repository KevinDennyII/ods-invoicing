import logoUrl from '../assets/ods-logo.jpg';
import './logo.css';

/** The real ODS lockup. Brand assets are used as supplied, never redrawn. */
export const Logo = ({ size = 'md' }) => (
  <img className={`logo logo--${size}`} src={logoUrl} alt="OhhDenny Services" width="1024" height="361" />
);
