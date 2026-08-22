package ktanesolver.module.modded.regular.fourcardmonte;import java.util.List;import ktanesolver.logic.ModuleOutput;
public record FourCardMonteOutput(String hand,int coinPosition,int coinValue,int originalCardPosition,int finalCardPosition,String payment,List<String> commands)implements ModuleOutput{}
