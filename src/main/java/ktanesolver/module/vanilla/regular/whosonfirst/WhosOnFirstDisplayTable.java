 package ktanesolver.module.vanilla.regular.whosonfirst;

 import java.util.Map;

 public final class WhosOnFirstDisplayTable {

    private WhosOnFirstDisplayTable() {}

    public static final Map<String, ButtonPosition> DISPLAY_MAP = Map.ofEntries(
        Map.entry("YES", ButtonPosition.MIDDLE_LEFT),
        Map.entry("FIRST", ButtonPosition.TOP_RIGHT),
        Map.entry("DISPLAY", ButtonPosition.BOTTOM_RIGHT),
        Map.entry("OKAY", ButtonPosition.TOP_RIGHT),
        Map.entry("SAYS", ButtonPosition.BOTTOM_RIGHT),
        Map.entry("NOTHING", ButtonPosition.MIDDLE_LEFT),
        Map.entry(" ", ButtonPosition.BOTTOM_LEFT),
        Map.entry("BLANK", ButtonPosition.MIDDLE_RIGHT),
        Map.entry("NO", ButtonPosition.BOTTOM_RIGHT),
        Map.entry("LED", ButtonPosition.MIDDLE_LEFT),
        Map.entry("LEAD", ButtonPosition.BOTTOM_RIGHT),
        Map.entry("READ", ButtonPosition.MIDDLE_RIGHT),
        Map.entry("RED", ButtonPosition.MIDDLE_RIGHT),
        Map.entry("REED", ButtonPosition.BOTTOM_LEFT),
        Map.entry("LEED", ButtonPosition.BOTTOM_LEFT),
        Map.entry("HOLD ON", ButtonPosition.BOTTOM_RIGHT),
        Map.entry("YOU", ButtonPosition.MIDDLE_RIGHT),
        Map.entry("YOU ARE", ButtonPosition.BOTTOM_RIGHT),
        Map.entry("YOUR", ButtonPosition.MIDDLE_RIGHT),
        Map.entry("YOU'RE", ButtonPosition.MIDDLE_RIGHT),
        Map.entry("UR", ButtonPosition.TOP_LEFT),
        Map.entry("THERE", ButtonPosition.BOTTOM_RIGHT),
        Map.entry("THEY'RE", ButtonPosition.BOTTOM_LEFT),
        Map.entry("THEIR", ButtonPosition.MIDDLE_RIGHT),
        Map.entry("THEY ARE", ButtonPosition.MIDDLE_LEFT),
        Map.entry("SEE", ButtonPosition.BOTTOM_RIGHT),
        Map.entry("C", ButtonPosition.TOP_RIGHT),
        Map.entry("CEE", ButtonPosition.BOTTOM_RIGHT)
    );
}
