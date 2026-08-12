package ktanesolver.module.modded.regular.regularcrazytalk;

import ktanesolver.logic.ModuleOutput;

public record RegularCrazyTalkOutput(int position,String phrase,int digit,int hold,int release,String embellishment) implements ModuleOutput{}
