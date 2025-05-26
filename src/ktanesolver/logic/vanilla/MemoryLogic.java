package ktanesolver.logic.vanilla;

import ktanesolver.model.vanilla.MemoryModel;

/**
 * Logic class for the Memory module.
 */
public class MemoryLogic {
    
    /**
     * Determine the position to press based on the display number and stage
     * @param model The memory model
     * @return The position to press
     */
    public static int determinePositionToPress(MemoryModel model) {
        int display = model.getDisplay();
        int stage = model.getStage();
        
        switch (stage) {
            case 1:
                switch (display) {
                    case 1: return 2;
                    case 2: return 2;
                    case 3: return 3;
                    case 4: return 4;
                    default: return 0;
                }
            case 2:
                switch (display) {
                    case 1: return findPositionOfNumber(model, 4);
                    case 2: return model.getPosition(1);
                    case 3: return 1;
                    case 4: return model.getPosition(1);
                    default: return 0;
                }
            case 3:
                switch (display) {
                    case 1: return findPositionOfNumber(model, model.getNumber(2));
                    case 2: return findPositionOfNumber(model, model.getNumber(1));
                    case 3: return 3;
                    case 4: return findPositionOfNumber(model, 4);
                    default: return 0;
                }
            case 4:
                switch (display) {
                    case 1: return model.getPosition(1);
                    case 2: return 1;
                    case 3: return model.getPosition(2);
                    case 4: return model.getPosition(2);
                    default: return 0;
                }
            case 5:
                switch (display) {
                    case 1: return findPositionOfNumber(model, model.getNumber(1));
                    case 2: return findPositionOfNumber(model, model.getNumber(2));
                    case 3: return findPositionOfNumber(model, model.getNumber(4));
                    case 4: return findPositionOfNumber(model, model.getNumber(3));
                    default: return 0;
                }
            default:
                return 0;
        }
    }
    
    /**
     * Find the position of a specific number in the current stage
     * @param model The memory model
     * @param number The number to find
     * @return The position of the number, or 0 if not found
     */
    private static int findPositionOfNumber(MemoryModel model, int number) {
        // This is a placeholder method since we don't have a way to find the position of a number
        // In a real implementation, we would need to know the positions of all numbers in the current stage
        return 0;
    }
    
    /**
     * Get the instruction for the current stage
     * @param model The memory model
     * @return The instruction
     */
    public static String getInstruction(MemoryModel model) {
        int display = model.getDisplay();
        int stage = model.getStage();
        
        if (stage == 5) {
            switch (display) {
                case 1: return "Press the button labeled \"" + model.getNumber(1) + "\"";
                case 2: return "Press the button labeled \"" + model.getNumber(2) + "\"";
                case 3: return "Press the button labeled \"" + model.getNumber(4) + "\"";
                case 4: return "Press the button labeled \"" + model.getNumber(3) + "\"";
                default: return "";
            }
        } else {
            int position = determinePositionToPress(model);
            return "Press the " + position + " button, what is the number on it?";
        }
    }
    
    /**
     * Update the model with the position and number for the current stage
     * @param model The memory model
     * @param position The position
     * @param number The number
     */
    public static void updateStage(MemoryModel model, int position, int number) {
        int stage = model.getStage();
        model.setPosition(stage, position);
        model.setNumber(stage, number);
    }
}