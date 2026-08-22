package ktanesolver.module.modded.regular.subscribetopewdiepie;

import ktanesolver.logic.ModuleOutput;

public record SubscribeToPewdiepieOutput(
    int startingPewdiepie, int startingTSeries,
    int adjustedPewdiepie, int adjustedTSeries,
    int subscriberGap, String submission
) implements ModuleOutput {}
