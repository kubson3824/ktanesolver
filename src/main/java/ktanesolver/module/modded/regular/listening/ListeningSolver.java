package ktanesolver.module.modded.regular.listening;

import java.util.Map;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo(
        type = ModuleType.LISTENING,
        id = "listening",
        name = "Listening",
        category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
        description = "Identify sounds and enter the correct code",
        tags = {"audio", "pattern", "symbols"}
)
public class ListeningSolver extends AbstractModuleSolver<ListeningInput, ListeningOutput> {

    private static final Map<String, String> SOUND_TO_CODE_MAP = Map.ofEntries(
        Map.entry("Taxi Dispatch", "&&&**"),
        Map.entry("Dial-up Internet", "*#&*&"),
        Map.entry("Cow", "&$#$&"),
        Map.entry("Police Radio Scanner", "**###"),
        Map.entry("Extractor Fan", "$#$*&"),
        Map.entry("Censorship Bleep", "&&$&*"),
        Map.entry("Train Station", "#$$**"),
        Map.entry("Medieval Weapons", "&$**&"),
        Map.entry("Arcade", "$#$#*"),
        Map.entry("Door Closing", "#$#&$"),
        Map.entry("Casino", "**$*#"),
        Map.entry("Chainsaw", "&#&&#"),
        Map.entry("Supermarket", "#$$&*"),
        Map.entry("Compressed Air", "$$*$*"),
        Map.entry("Soccer Match", "##*$*"),
        Map.entry("Servo Motor", "$&#$$"),
        Map.entry("Tawny Owl", "$#*$&"),
        Map.entry("Waterfall", "&**$$"),
        Map.entry("Sewing Machine", "#&&*#"),
        Map.entry("Tearing Fabric", "$&&*&"),
        Map.entry("Thrush Nightingale", "**#**"),
        Map.entry("Zipper", "&$&##"),
        Map.entry("Car Engine", "&#**&"),
        Map.entry("Vacuum Cleaner", "#&$*&"),
        Map.entry("Reloading Glock 19", "$&**#"),
        Map.entry("Ballpoint Pen Writing", "$*$**"),
        Map.entry("Oboe", "&#$$#"),
        Map.entry("Rattling Iron Chain", "*#$&&"),
        Map.entry("Saxophone", "$&&**"),
        Map.entry("Book Page Turning", "###&$"),
        Map.entry("Tuba", "#&$##"),
        Map.entry("Table Tennis", "*$$&$"),
        Map.entry("Marimba", "&*$*$"),
        Map.entry("Squeaky Toy", "$*&##"),
        Map.entry("Phone Ringing", "&$$&*"),
        Map.entry("Helicopter", "#&$&&"),
        Map.entry("Tibetan Nuns", "#&&&&"),
        Map.entry("Firework Exploding", "$&$$*"),
        Map.entry("Throat Singing", "**$$$"),
        Map.entry("Glass Shattering", "*$*$*"),
        Map.entry("Beach", "*&*&&")
    );

    @Override
    public SolveResult<ListeningOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ListeningInput input) {
        String soundDescription = input.soundDescription();
        
        // Validate input
        if (soundDescription == null || soundDescription.trim().isEmpty()) {
            ListeningOutput output = new ListeningOutput("");
            return success(output, false);
        }
        
        // Store module state
        storeState(module, "soundDescription", soundDescription);
        
        // Look up the code for the sound
        String code = SOUND_TO_CODE_MAP.get(soundDescription.trim());
        
        if (code == null) {
            // Try case-insensitive search
            code = SOUND_TO_CODE_MAP.entrySet().stream()
                .filter(entry -> entry.getKey().equalsIgnoreCase(soundDescription.trim()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);
        }
        
        if (code == null) {
            ListeningOutput output = new ListeningOutput("");
            return success(output, false);
        }
        
        // Return the code
        ListeningOutput output = new ListeningOutput(code);
        return success(output);
    }
}
