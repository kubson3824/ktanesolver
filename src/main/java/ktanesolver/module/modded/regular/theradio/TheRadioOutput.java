package ktanesolver.module.modded.regular.theradio;
import java.util.List;import ktanesolver.logic.ModuleOutput;
public record TheRadioOutput(String country,String channelName,int channelNumber,String frequency,String transmission,String transmitAt,String timingRule,List<String>commands)implements ModuleOutput{}
