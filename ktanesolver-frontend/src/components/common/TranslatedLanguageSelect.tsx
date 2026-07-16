export const TRANSLATED_LANGUAGES = [
  ["CS", "Czech"], ["DA", "Danish"], ["DE", "German"], ["EN", "English"],
  ["EO", "Esperanto"], ["ES", "Spanish"], ["ET", "Estonian"], ["FI", "Finnish"],
  ["FR", "French"], ["HE", "Hebrew"], ["IT", "Italian"], ["JP", "Japanese"],
  ["KO", "Korean"], ["NL", "Dutch"], ["NO", "Norwegian"], ["PL", "Polish"],
  ["PT", "Portuguese"], ["RU", "Russian"], ["SV", "Swedish"], ["TH", "Thai"],
  ["ZHS", "Simplified Chinese"],
] as const;

export type TranslatedLanguageCode = typeof TRANSLATED_LANGUAGES[number][0];

export function TranslatedLanguageSelect({ value, onChange, disabled = false }: {
  value: TranslatedLanguageCode;
  onChange: (value: TranslatedLanguageCode) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Module language
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TranslatedLanguageCode)}
        disabled={disabled}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm normal-case text-foreground"
      >
        {TRANSLATED_LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
      </select>
    </label>
  );
}
