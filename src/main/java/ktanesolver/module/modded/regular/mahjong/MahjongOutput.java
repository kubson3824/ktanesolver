package ktanesolver.module.modded.regular.mahjong;
import java.util.List;import ktanesolver.logic.ModuleOutput;
public record MahjongOutput(List<String>pair,List<String>matchRow1,List<String>matchRow2,int pairNumber)implements ModuleOutput{}
