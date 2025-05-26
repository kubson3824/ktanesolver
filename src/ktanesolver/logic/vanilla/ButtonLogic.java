package ktanesolver.logic.vanilla;

import ktanesolver.model.Bomb;
import ktanesolver.model.vanilla.ButtonModel;
import ktanesolver.model.vanilla.ButtonStripModel;

/**
 * Logic class for the Button module.
 */
public class ButtonLogic {
    
    /**
     * Enum representing the possible actions for the button
     */
    public enum ButtonAction {
        PUSH,
        HOLD
    }
    
    /**
     * Determine the action to take based on the button's properties and the bomb's properties
     * @param button The button model
     * @param bomb The bomb model
     * @return The action to take (PUSH or HOLD)
     */
    public static ButtonAction determineAction(ButtonModel button, Bomb bomb) {
        String color = button.getColor();
        String text = button.getText();
        
        // Rule 1: Blue button with "Abort" text
        if (color.equals("blue") && text.equals("abort")) {
            return ButtonAction.HOLD;
        }
        
        // Rule 2: More than 1 battery and "Detonate" text
        if (bomb.getTotalBatteries() > 1 && text.equals("detonate")) {
            return ButtonAction.PUSH;
        }
        
        // Rule 3: White button and lit CAR indicator
        if (color.equals("white") && bomb.hasLitIndicator("CAR")) {
            return ButtonAction.HOLD;
        }
        
        // Rule 4: More than 2 batteries and lit FRK indicator
        if (bomb.getTotalBatteries() > 2 && bomb.hasLitIndicator("FRK")) {
            return ButtonAction.PUSH;
        }
        
        // Rule 5: Yellow button
        if (color.equals("yellow")) {
            return ButtonAction.HOLD;
        }
        
        // Rule 6: Red button with "Hold" text
        if (color.equals("red") && text.equals("hold")) {
            return ButtonAction.PUSH;
        }
        
        // Rule 7: Otherwise
        return ButtonAction.HOLD;
    }
    
    /**
     * Determine when to release the button based on the strip color
     * @param strip The button strip model
     * @return A string describing when to release the button
     */
    public static String determineReleaseTime(ButtonStripModel strip) {
        String stripColor = strip.getStripColor();
        
        if (stripColor.equals("blue")) {
            return "Release when the timer has a 4 in it";
        } else if (stripColor.equals("white")) {
            return "Release when the timer has a 1 in it";
        } else if (stripColor.equals("yellow")) {
            return "Release when the timer has a 5 in it";
        } else {
            // Different from above or any other color
            return "Release when the timer has a 1 in it";
        }
    }
}