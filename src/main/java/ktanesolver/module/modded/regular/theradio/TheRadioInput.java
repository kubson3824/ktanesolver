package ktanesolver.module.modded.regular.theradio;
import ktanesolver.logic.ModuleInput;
public record TheRadioInput(String barcode,Integer startingChannel,String startingTransmission)implements ModuleInput{}
