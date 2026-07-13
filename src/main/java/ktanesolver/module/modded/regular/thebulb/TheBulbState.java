package ktanesolver.module.modded.regular.thebulb;

import java.util.List;

record TheBulbState(int step, TheBulbInput.Color color, boolean opaque, boolean initiallyOn, String firstButton,
	String secondButton, String rememberedIndicator, List<String> actions) {}
