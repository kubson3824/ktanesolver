package ktanesolver.module.modded.regular.challengeandcontact;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
    type = ModuleType.CHALLENGE_AND_CONTACT,
    id = "challengeAndContact",
    name = "Challenge & Contact",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Decode the growing letter prefix and identify three clue answers.",
    tags = {"word", "cipher", "timing", "multi-stage"}
)
public class ChallengeAndContactSolver extends AbstractModuleSolver<ChallengeAndContactInput, ChallengeAndContactOutput> {
    private static final Map<String, List<String>> ANSWERS = Map.ofEntries(
        entry("VANILLA", "Keypad,Maze,Memory,Password,Wires"),
        entry("ROYAL", "Accumulation,Algebra,Blockbusters,Catchphrase,Coffeebucks,Countdown,Hieroglyphics,Homophones,Lightspeed,Maintenance,Modulo,Poker,Quintuples,Retirement,Skyrim,Snooker,Westeros"),
        entry("TIMWI", "Battleship,Bitmaps,Braille,Coordinates,Friendship,Gridlock,Hexamaze,Hogwarts,Kudosudoku,Lasers,Mafia,Mahjong,Souvenir,Superlogic,Tennis,Yahtzee,Zoo"),
        entry("MAZE", "Blind,Boolean,Factory,Module,Polyhedral,Scrambler,USA"),
        entry("AUDIO", "Code,Coffeebucks,Fogey,Hedgehog,Kudosudoku,Listening,Safe,Samples,Sequence,Sequencer,Sounds"),
        entry("SQUARE", "Button,Colored,Decolored,Discolored,Divided,Mystic,Uncolored,Varicolored"),
        entry("NEEDY", "Aa,Alpha,Determinants,Edgework,Filibuster,Knob,Math,Pong,Tetris,Wingdings"),
        entry("PORT", "AC,HDMI,PCMCIA,USB,VGA"),
        entry("INDICATOR", "BOB,CAR,CLR,FRK,FRQ,IND,MSA,NSA,SIG,SND,TRN"),
        entry("RULESEED", "Bitmaps,Boggle,FizzBuzz,Friendship,Mahjong,Radiator"),
        entry("BUTTON", "Bamboozling,Broken,Complicated,Grid,Logical,Masher,Morse,Rapid,Sequence,Spinning,Square,The,Triangle"),
        entry("WIRE", "Complicated,Perplexing,Placement,Risky,Sequence,Seven,Skinny,Spaghetti,The"),
        entry("NO_EA", "Cooking,Countdown,FizzBuzz,Functions,Gridlock,Hunting,Instructions,Kudosudoku,Logic,Modulo,Plumbing,Rhythms,Scripting,Sink,Skyrim,Synonyms,Zoni,Zoo"),
        entry("MUSIC", "Chords,Jukebox,Keys,Qualities,Rhythms,Samples,Sequence,Sequencer,Sings"),
        entry("ICE_CREAM", "Adam,Ashley,Bob,Cheryl,Dave,Gary,George,Jacob,Jade,Jessica,Mike,Pat,Sally,Sam,Sean,Simon,Taylor,Tim,Tom,Victor"),
        entry("MURDER", "Ballroom,Conservatory,Hall,Kitchen,Library,Lounge,Study"),
        entry("CONTACT", "Alfa,Bravo,Charlie,Delta,Echo,Foxtrot,Golf,Hotel,India,Juliett,Kilo,Lima,Mike,November,Oscar,Papa,Quebec,Romeo,Sierra,Tango,Uniform,Victor,Whiskey,Yankee,Zulu"),
        entry("ADVENTURE", "Balloon,Battery,Bellows,Feather,Lamp,Moonstone,Potion,Stepladder,Sunstone,Symbol,Ticket,Trophy"),
        entry("TURN_KEYS", "Astrology,Cryptography,Maze,Memory,Plumbing,Semaphore,Switches"),
        entry("ANAGRAMS", "Barely,Barley,Bleary,Caller,Cellar,Duster,Looped,Master,Poodle,Pooled,Rashes,Recall,Recuse,Rescue,Rudest,Rusted,Seated,Secure,Sedate,Shares,Shears,Stream,Tamers,Teased"),
        entry("DISEASE", "Braintenance,Detonession,Emojilepsy,HRV,Indicitis,Jaundry,Jukepox,Legomania,Microcontusion,Narcolization,Neurolysis,OCD,Orientitis,Quackgrounds,Tetrinus,Verticode,Widgeting,XMAs,Zooties"),
        entry("MONSPLODE", "Aluga,Asteran,Bob,Buhar,Caadarim,Clondar,Docsplode,Flaurim,Gloorim,Lanaluff,Lugirit,Magmy,Melbor,Mountoise,Myrchat,Nibs,Percy,Pouse,Ukkens,Vellarim,Violan,Zapra,Zenlad")
    );

    @Override
    protected SolveResult<ChallengeAndContactOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, ChallengeAndContactInput input
    ) {
        if (input == null || input.stage() == null || input.clue() == null || input.displayedLetter() == null) {
            return failure("Enter the stage, clue, and newly displayed letter");
        }
        if (input.stage() < 1 || input.stage() > 3) return failure("The stage must be from 1 through 3");
        String clue = input.clue().trim().toUpperCase(Locale.ROOT);
        List<String> words = ANSWERS.get(clue);
        if (words == null) return failure("Select one of the manual's Challenge & Contact clues");
        String shown = input.displayedLetter().trim().toUpperCase(Locale.ROOT);
        if (!shown.matches("[A-Z]")) return failure("Enter only the newly revealed letter");

        List<String> displayed = input.stage() == 1 ? new ArrayList<>() : strings(module.getState().get("challengeAndContactDisplayedLetters"));
        String prefix = input.stage() == 1 ? "" : String.valueOf(module.getState().getOrDefault("challengeAndContactDecodedPrefix", ""));
        if (displayed.size() != input.stage() - 1 || prefix.length() != input.stage() - 1) {
            return failure("The saved streak does not match this stage; restart at stage 1 after a strike or reset");
        }
        displayed.add(shown);
        boolean plain = Boolean.TRUE.equals(bomb.getIndicators().get("BOB"))
            && bomb.getAaBatteryCount() + bomb.getDBatteryCount() == 0;
        int count = input.stage() == 1 ? bomb.getModules().size()
            : (int) bomb.getModules().stream().filter(ModuleEntity::isSolved).count();
        char decoded = plain ? shown.charAt(0) : count % 2 == 0 ? rot13(shown.charAt(0)) : atbash(shown.charAt(0));
        prefix += decoded;
        String finalPrefix = prefix;
        String answer = words.stream().map(w -> w.toUpperCase(Locale.ROOT)).sorted()
            .filter(w -> w.startsWith(finalPrefix)).findFirst().orElse(null);
        if (answer == null) return failure("No word for that clue starts with the decoded prefix; recheck the letter and module count");

        storeState(module, "challengeAndContactDisplayedLetters", List.copyOf(displayed));
        storeState(module, "challengeAndContactDecodedPrefix", prefix);
        storeState(module, "challengeAndContactNextStage", input.stage() == 3 ? 3 : input.stage() + 1);
        return success(new ChallengeAndContactOutput(input.stage(), answer, prefix, List.copyOf(displayed)), input.stage() == 3);
    }

    private static Map.Entry<String, List<String>> entry(String key, String csv) {
        return Map.entry(key, List.of(csv.split(",")));
    }
    private static char rot13(char c) { return (char) ('A' + (c - 'A' + 13) % 26); }
    private static char atbash(char c) { return (char) ('Z' - (c - 'A')); }
    private static List<String> strings(Object value) {
        if (!(value instanceof List<?> list)) return new ArrayList<>();
        return new ArrayList<>(list.stream().map(String::valueOf).toList());
    }
}
