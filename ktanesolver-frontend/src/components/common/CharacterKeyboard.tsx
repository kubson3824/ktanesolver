import type { TranslatedLanguageCode } from "./TranslatedLanguageSelect";

export const TRANSLATED_KEYBOARD_CHARACTERS = {
  CS: "ABCDEFGHIJKLMNOPQRSTUVWXYZ©ŽŠÁÍÝĚČŮÉŘ?",
  DA: "ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ?",
  DE: "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜẞ©'10",
  EN: "ABCDEFGHIJKLMNOPQRSTUVWXYZ?'",
  EO: "ABCDEFGHIJKLMNOPQRSTUVWXYZĈĜĤĴŜŬ?",
  ES: "ABCDEFGHIJKLMNOPQRSTUVWXYZÓÁÚÍ¿É?",
  ET: "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜÕ?",
  FI: "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ#-6?",
  FR: "ABCDEFGHIJKLMNOPQRSTUVWXYZÀÇÉÈÑÖÜÊ'?Û",
  HE: "אבגדהוזחטיכלמנסעפצקרשתךםןףץNIAEM",
  IT: "ABCDEFGHIJKLMNOPQRSTUVWXYZ'?",
  JP: "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわんを゛゜押長中止爆破空白画面待っOKオッケー何以外意移動異同解雇回顧懐古蚕斎藤斉齋齊1位置一壱伊地終左上真下右違絵ぁ～?アツクナルリエインコﾞウカシｮキチフタストレノハセモマソヒテサロｨヤﾟニｭメワラｬ",
  KO: "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㅐㅔ누르시오른채유지접근금폭파어이의빈칸네개내잠만일단다음그거눌러!아니옆에말고안라까비있써뭐?왼쪽위",
  NL: "ABCDEFGHIJKLMNOPQRSTUVWXYZ?",
  NO: "ABCDEFGHIJKLMNOPQRSTUVWXYZÈÉÆØÅ!?",
  PL: "ABCDEFGHIJKLMNOPQRSTUVWXYZĄĆ©ĘÉŁŃÓŚŹŻ?",
  PT: "ABCDEFGHIJKLMNOPQRSTUVWXYZÊÓÃ^ÁÍÉ2Ç?",
  RU: "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯЁ-",
  SV: "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÖÄ?",
  TH: "กขฃคฅฆงจฉชซญดฎตฏถฐทธฑฒนณบปผฝพภฟมยรลฬวศษสหอฮฤๅะาิีึืุูเแไใโำ่้๊๋ั็์ๆฯ",
  ZHS: "ABCDEFGHIJKLMNOPQRSTUVWXYZ按下住解除引爆显示空的什么四根线没有好吵听不到了哪一个嗯玩接电话又错~样变要假。.省略号句分钟等我过第二速度快点炸地是右边编真吗次时间左角上中问1l关门放狼狗鱼杀华凶看鸡录片宁还心手贝吃乌穿鳄今网",
} satisfies Record<TranslatedLanguageCode, string>;

export const ONLY_CONNECT_KEYBOARD_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZÇËÀÈÉÍÏÒÓÚÜĆČĐŠŽÁÝĎĚŇŘŤŮÅÆØĈĜĤĴŜŬÄÕÖßŐŰÐÞĀĒĢĪĶĻŅŪĄĖĘĮŁŃŚŹŻÂÃÊÔÎĂȘȚĞŞŴŶı";

export default function CharacterKeyboard({
  characters,
  onCharacter,
  onBackspace,
  onSpace,
  targetLabel,
  disabled = false,
}: {
  characters: string;
  onCharacter: (character: string) => void;
  onBackspace: () => void;
  onSpace?: () => void;
  targetLabel?: string;
  disabled?: boolean;
}) {
  const keys = [...new Set(Array.from(characters.normalize("NFC")))].filter(
    (character) => !/\s/u.test(character),
  );

  return (
    <details className="mt-3 rounded-md border border-border bg-muted/20 p-2">
      <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground">
        On-screen keyboard{targetLabel ? ` — ${targetLabel}` : ""}
      </summary>
      <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="On-screen keyboard">
        {keys.map((character) => (
          <button
            key={character}
            type="button"
            onClick={() => onCharacter(character)}
            disabled={disabled}
            aria-label={`Type ${character}`}
            className="min-h-9 min-w-9 rounded border border-border bg-background px-2 font-mono text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            {character}
          </button>
        ))}
        {onSpace && (
          <button
            type="button"
            onClick={onSpace}
            disabled={disabled}
            className="min-h-9 rounded border border-border bg-background px-4 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            Space
          </button>
        )}
        <button
          type="button"
          onClick={onBackspace}
          disabled={disabled}
          aria-label="Backspace"
          className="min-h-9 rounded border border-border bg-background px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          ⌫
        </button>
      </div>
    </details>
  );
}
