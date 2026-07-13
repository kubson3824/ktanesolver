package ktanesolver.module.modded.regular.thirdbase;

import java.util.List;
import java.util.Map;

import ktanesolver.module.vanilla.regular.whosonfirst.ButtonPosition;

public record ThirdBaseState(
	List<String> displayHistory,
	List<Map<ButtonPosition, String>> buttonHistory,
	List<Map<ButtonPosition, String>> buttonPressHistory
) {
}
