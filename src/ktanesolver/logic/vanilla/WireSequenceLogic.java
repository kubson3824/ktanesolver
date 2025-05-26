package ktanesolver.logic.vanilla;

import ktanesolver.model.vanilla.WireSequenceModel;

/**
 * Logic class for the Wire Sequence module.
 */
public class WireSequenceLogic {
    
    /**
     * Process the wire sequence
     * @param model The wire sequence model
     */
    public static void processWireSequence(WireSequenceModel model) {
        String color = model.getColor();
        String letter = model.getLetter();
        
        switch (color) {
            case "red": {
                if (model.getRedOccurrences()[model.getRedCount()].contains(letter)) {
                    model.setResult("Cut the wire");
                } else {
                    model.setResult("Don't cut the wire");
                }
                model.setRedCount(model.getRedCount() + 1);
                break;
            }
            case "blue": {
                if (model.getBlueOccurrences()[model.getBlueCount()].contains(letter)) {
                    model.setResult("Cut the wire");
                } else {
                    model.setResult("Don't cut the wire");
                }
                model.setBlueCount(model.getBlueCount() + 1);
                break;
            }
            case "black": {
                if (model.getBlackOccurrences()[model.getBlackCount()].contains(letter)) {
                    model.setResult("Cut the wire");
                } else {
                    model.setResult("Don't cut the wire");
                }
                model.setBlackCount(model.getBlackCount() + 1);
                break;
            }
            default: {
                model.setResult("Invalid color");
                break;
            }
        }
    }
    
    /**
     * Reset the counters
     * @param model The wire sequence model
     */
    public static void resetCounters(WireSequenceModel model) {
        model.reset();
    }
}