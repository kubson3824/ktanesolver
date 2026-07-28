package ktanesolver.module.modded.regular.londonunderground;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record LondonUndergroundOutput(List<LondonUndergroundLeg> journey, int stage) implements ModuleOutput {}
