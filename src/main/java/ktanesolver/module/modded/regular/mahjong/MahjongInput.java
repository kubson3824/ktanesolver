package ktanesolver.module.modded.regular.mahjong;
import java.util.List;import ktanesolver.logic.ModuleInput;
public record MahjongInput(String countingTile,List<String>availableTiles,Integer pairsRemoved)implements ModuleInput{}
