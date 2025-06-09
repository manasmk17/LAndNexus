import { formatCurrency } from '@/lib/i18n';

interface LocalizedDateProps {
  date: Date | string;
  format?: 'short' | 'long' | 'relative';
  className?: string;
}

export function LocalizedDate({ date, format = 'long', className }: LocalizedDateProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'relative') {
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return <span className={className}>{diffMinutes} minutes ago</span>;
    } else if (diffHours < 24) {
      return <span className={className}>{diffHours} hours ago</span>;
    } else if (diffDays < 7) {
      return <span className={className}>{diffDays} days ago</span>;
    }
  }
  
  const options: Intl.DateTimeFormatOptions = format === 'short'
    ? { year: 'numeric', month: '2-digit', day: '2-digit' }
    : { year: 'numeric', month: 'long', day: 'numeric' };
  
  return (
    <span className={className}>
      {new Intl.DateTimeFormat('en-US', options).format(dateObj)}
    </span>
  );
}

interface LocalizedCurrencyProps {
  amount: number;
  className?: string;
  showSymbol?: boolean;
}

export function LocalizedCurrency({ amount, className, showSymbol = true }: LocalizedCurrencyProps) {
  const formatted = formatCurrency(amount);
  
  return (
    <span className={className}>
      {showSymbol ? formatted : formatted.replace(/[^\d\s,.-]/g, '')}
    </span>
  );
}

interface LocalizedNumberProps {
  number: number;
  className?: string;
}

export function LocalizedNumber({ number, className }: LocalizedNumberProps) {
  return (
    <span className={className}>
      {new Intl.NumberFormat('en-US').format(number)}
    </span>
  );
}

interface LocalizedPluralProps {
  count: number;
  singular: string;
  plural?: string;
  className?: string;
}

export function LocalizedPlural({ count, singular, plural, className }: LocalizedPluralProps) {
  const pluralForm = plural || `${singular}s`;
  const text = count === 1 ? singular : pluralForm;
  
  return (
    <span className={className}>
      {count} {text}
    </span>
  );
}