// Language switcher removed - English only
export function LanguageSwitcher() {
  return null;
}

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 px-3">
          <Globe className="h-4 w-4 me-2" />
          <span className="hidden sm:inline">
            {currentLanguage === 'ar' ? 'العربية' : 'EN'}
          </span>
          <span className="sm:hidden">
            {currentLanguage === 'ar' ? 'ع' : 'EN'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          className={`cursor-pointer ${currentLanguage === 'en' ? 'bg-accent' : ''}`}
        >
          <span className="inline-flex items-center gap-2">
            🇺🇸 {t('language.english')}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('ar')}
          className={`cursor-pointer ${currentLanguage === 'ar' ? 'bg-accent' : ''}`}
        >
          <span className="inline-flex items-center gap-2">
            🇸🇦 {t('language.arabic')}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}