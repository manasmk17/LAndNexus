import { useTranslation } from 'react-i18next';
import { formatDate, formatCurrency, formatNumber } from '@/lib/i18n';

interface LocalizedDateProps {
  date: Date | string;
  format?: 'short' | 'long' | 'relative';
  className?: string;
}

export function LocalizedDate({ date, format = 'long', className }: LocalizedDateProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  
  const formatDate = (date: Date | string, format: string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (format === 'relative') {
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 60) {
        return `${diffMinutes} ${locale === 'ar' ? 'دقيقة' : 'minutes ago'}`;
      } else if (diffHours < 24) {
        return `${diffHours} ${locale === 'ar' ? 'ساعة' : 'hours ago'}`;
      } else if (diffDays < 7) {
        return `${diffDays} ${locale === 'ar' ? 'يوم' : 'days ago'}`;
      }
    }
    
    if (locale === 'ar') {
      const options: Intl.DateTimeFormatOptions = format === 'short' 
        ? { year: 'numeric', month: '2-digit', day: '2-digit' }
        : { year: 'numeric', month: 'long', day: 'numeric' };
      return new Intl.DateTimeFormat('ar-AE', options).format(dateObj);
    }
    
    const options: Intl.DateTimeFormatOptions = format === 'short'
      ? { year: 'numeric', month: '2-digit', day: '2-digit' }
      : { year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  };

  return (
    <span className={className}>
      {formatDate(date, format)}
    </span>
  );
}

interface LocalizedCurrencyProps {
  amount: number;
  className?: string;
  showSymbol?: boolean;
}

export function LocalizedCurrency({ amount, className, showSymbol = true }: LocalizedCurrencyProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  
  const formatted = formatCurrency(amount, locale);
  
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
  const { i18n } = useTranslation();
  const locale = i18n.language;
  
  return (
    <span className={className}>
      {formatNumber(number, locale)}
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
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  
  // Use i18next's built-in pluralization
  const key = plural ? `${singular}_${plural}` : singular;
  
  return (
    <span className={className}>
      {t(key, { count })}
    </span>
  );
}