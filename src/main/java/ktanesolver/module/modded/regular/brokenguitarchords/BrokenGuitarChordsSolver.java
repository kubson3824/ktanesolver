package ktanesolver.module.modded.regular.brokenguitarchords;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type = ModuleType.BROKEN_GUITAR_CHORDS, id = "BrokenGuitarChordsModule", name = "Broken Guitar Chords",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Find a playable six-string voicing for the displayed chord with one broken string.",
    tags = {"music", "chord", "guitar"})
public class BrokenGuitarChordsSolver extends AbstractModuleSolver<BrokenGuitarChordsInput, BrokenGuitarChordsOutput> {
    private static final int[] OPEN = {4, 9, 2, 7, 11, 4};
    private static final String[] NOTES = {"C","C#","D","D#","E","F","F#","G","G#","A","A#","B"};
    private static final Map<String, int[]> QUALITIES = Map.ofEntries(
        Map.entry("", new int[]{0,4,7}), Map.entry("m", new int[]{0,3,7}), Map.entry("6", new int[]{0,4,7,9}),
        Map.entry("7", new int[]{0,4,7,10}), Map.entry("9", new int[]{0,2,4,10}), Map.entry("add9", new int[]{0,2,4,7}),
        Map.entry("m6", new int[]{0,3,7,9}), Map.entry("m7", new int[]{0,3,7,10}), Map.entry("maj7", new int[]{0,4,7,11}),
        Map.entry("dim", new int[]{0,3,6}), Map.entry("dim7", new int[]{0,3,6,9}), Map.entry("+", new int[]{0,4,8}), Map.entry("sus", new int[]{0,5,7}));

    @Override protected SolveResult<BrokenGuitarChordsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, BrokenGuitarChordsInput input) {
        if (input == null || input.chord() == null || input.brokenString() == null) return failure("Enter the displayed chord and broken string");
        if (input.brokenString() < 1 || input.brokenString() > 6) return failure("Broken string must be from 1 through 6, left to right");
        Matcher m = Pattern.compile("^([A-Ga-g])([#b♯♭]?)(m6|m7|maj7|dim7|add9|dim|sus|m|6|7|9|\\+)?$").matcher(input.chord().trim());
        if (!m.matches()) return failure("Enter a chord shown in the manual, such as C#, Ebm7, or Asus");
        int root = note(m.group(1).toUpperCase(Locale.ROOT) + m.group(2).replace('♯','#').replace('♭','b'));
        String quality = m.group(3) == null ? "" : m.group(3);
        int[] intervals = QUALITIES.get(quality);
        if (root < 0 || intervals == null) return failure("Unknown chord");
        Set<Integer> target = new LinkedHashSet<>(); for (int interval : intervals) target.add((root + interval) % 12);
        List<List<String>> options = new ArrayList<>();
        for (int s = 0; s < 6; s++) {
            if (s == input.brokenString() - 1) { options.add(List.of("x")); continue; }
            List<String> values = new ArrayList<>(List.of("x"));
            for (int fret = 0; fret <= 13; fret++) if (target.contains((OPEN[s] + fret) % 12)) values.add(String.valueOf(fret));
            options.add(values);
        }
        List<String> best = search(options, target, 0, new ArrayList<>(), null);
        if (best == null) return failure("No playable voicing was found");
        List<String> noteNames = target.stream().sorted().map(i -> NOTES[i]).toList();
        storeState(module, "brokenGuitarChord", input.chord().trim()); storeState(module, "brokenGuitarBrokenString", input.brokenString());
        return success(new BrokenGuitarChordsOutput(input.chord().trim(), input.brokenString(), best, noteNames));
    }
    private static List<String> search(List<List<String>> options, Set<Integer> target, int string, List<String> chosen, List<String> best) {
        if (string == 6) return covers(chosen, target) && (best == null || score(chosen) < score(best)) ? List.copyOf(chosen) : best;
        for (String value : options.get(string)) { chosen.add(value); best = search(options, target, string + 1, chosen, best); chosen.remove(chosen.size() - 1); }
        return best;
    }
    private static boolean covers(List<String> values, Set<Integer> target) {
        Set<Integer> played = new HashSet<>(); for (int s = 0; s < 6; s++) if (!values.get(s).equals("x")) played.add((OPEN[s] + Integer.parseInt(values.get(s))) % 12);
        return played.containsAll(target);
    }
    private static int score(List<String> values) { int muted=0,max=0,sum=0; for(String v:values) if(v.equals("x")) muted++; else {int f=Integer.parseInt(v);max=Math.max(max,f);sum+=f;} return muted*10000+max*100+sum; }
    private static int note(String value) { return switch(value){case "C"->0;case "C#", "Db"->1;case "D"->2;case "D#", "Eb"->3;case "E"->4;case "F"->5;case "F#", "Gb"->6;case "G"->7;case "G#", "Ab"->8;case "A"->9;case "A#", "Bb"->10;case "B"->11;default->-1;}; }
}
