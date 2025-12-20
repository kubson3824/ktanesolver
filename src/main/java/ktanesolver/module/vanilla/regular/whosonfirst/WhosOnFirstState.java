
package ktanesolver.module.vanilla.regular.whosonfirst;

import java.util.List;
import java.util.Map;

public record WhosOnFirstState(List<String> displayHistory, List<Map<ButtonPosition, String>> buttonHistory, List<Map<ButtonPosition, String>> buttonPressHistory) {
}
