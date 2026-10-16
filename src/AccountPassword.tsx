import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAppearance } from './i18n';

export default function AccountPassword(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  const { tr } = useAppearance();
  return <span className="account-password">
    <input {...props} type={visible ? 'text' : 'password'} />
    <button type="button" aria-label={tr(visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور', visible ? 'Hide password' : 'Show password')} aria-pressed={visible} onClick={() => setVisible(value => !value)}>
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </span>;
}
