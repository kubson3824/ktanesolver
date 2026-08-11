package ktanesolver.module.modded.regular.streetfighter;

import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
    type = ModuleType.STREET_FIGHTER,
    id = "streetFighter",
    name = "Street Fighter",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Select an eligible fighter and calculate the indexed opponent.",
    tags = {"fighters", "venn diagram", "edgework", "selection"}
)
public class StreetFighterSolver extends AbstractModuleSolver<StreetFighterInput, StreetFighterOutput> {
    private static final List<Fighter> FIGHTERS = List.of(
        new Fighter("Ryu", "Japan"), new Fighter("E. Honda", "Japan"), new Fighter("Blanka", "Brazil"),
        new Fighter("Guile", "USA"), new Fighter("Balrog", "USA"), new Fighter("Vega", "Spain"),
        new Fighter("Ken", "USA"), new Fighter("Chun Li", "China"), new Fighter("Zangief", "USSR"),
        new Fighter("Dhalsim", "India"), new Fighter("Sagat", "Thailand"), new Fighter("M. Bison", "Unknown"));
    private static final String LETTERS_BY_MASK = "rhvlodugbkmcfnst";

    @Override
    protected SolveResult<StreetFighterOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, StreetFighterInput input
    ) {
        int mask = (bomb.getAaBatteryCount() >= 2 ? 1 : 0)
            | (bomb.serialHasVowel() ? 2 : 0)
            | (bomb.hasPort(PortType.RJ45) && bomb.hasPort(PortType.SERIAL) ? 4 : 0)
            | (bomb.getIndicators().values().stream().anyMatch(Boolean.TRUE::equals) ? 8 : 0);
        char required = LETTERS_BY_MASK.charAt(mask);
        List<Fighter> eligible = FIGHTERS.stream().filter(fighter -> fighter.key().indexOf(required) >= 0).toList();
        Fighter fighter = eligible.getFirst();
        long countryMatches = FIGHTERS.stream().filter(candidate -> sharesLetter(candidate.key(), fighter.country())).count();
        int opponentIndex = (int) ((countryMatches + fighter.key().length() + bomb.getModules().size()) % FIGHTERS.size());
        Fighter opponent = FIGHTERS.get(opponentIndex);
        return success(new StreetFighterOutput(
            String.valueOf(required).toUpperCase(Locale.ROOT), fighter.name(), opponent.name(), eligible.stream().map(Fighter::name).toList()));
    }

    private static boolean sharesLetter(String fighter, String country) {
        String normalizedCountry = country.toLowerCase(Locale.ROOT).replaceAll("[^a-z]", "");
        return fighter.chars().anyMatch(character -> normalizedCountry.indexOf(character) >= 0);
    }

    private record Fighter(String name, String country) {
        private String key() { return name.toLowerCase(Locale.ROOT).replaceAll("[^a-z]", ""); }
    }
}
