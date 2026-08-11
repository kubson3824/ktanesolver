package ktanesolver.module.modded.regular.simonspins;
import java.util.ArrayList;import java.util.List;
public record SimonSpinsState(int lastStage,List<Integer>remembered,List<String>lastPresses){public SimonSpinsState(){this(0,new ArrayList<>(),new ArrayList<>());}}
