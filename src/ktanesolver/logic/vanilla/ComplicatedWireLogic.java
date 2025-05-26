package ktanesolver.logic.vanilla;

import ktanesolver.model.Bomb;
import ktanesolver.model.vanilla.ComplicatedWireModel;

/**
 * Logic class for the Complicated Wires module.
 */
public class ComplicatedWireLogic {
    
    /**
     * Enum representing the possible actions for a complicated wire
     */
    public enum WireAction {
        CUT,
        DONT_CUT
    }
    
    /**
     * Determine whether to cut a complicated wire based on its properties and the bomb's properties
     * @param wire The complicated wire model
     * @param bomb The bomb model
     * @return The action to take (CUT or DONT_CUT)
     */
    public static WireAction determineAction(ComplicatedWireModel wire, Bomb bomb) {
        String color = wire.getColor();
        boolean hasLED = wire.hasLED();
        boolean hasStar = wire.hasStar();
        
        // Get the last digit of the serial number
        int lastDigit = getLastDigit(bomb.getSerialNumber());
        
        // Check if the last digit is even
        boolean isEven = (lastDigit % 2 == 0);
        
        // Check if there are at least 2 batteries
        boolean hasTwoBatteries = (bomb.getTotalBatteries() >= 2);
        
        // Check if there is a parallel port
        boolean hasParallelPort = (bomb.getPortParallel() > 0);
        
        // Determine the action based on the wire's properties and the bomb's properties
        if (hasLED) {
            if (hasStar) {
                if (color.equals("red")) {
                    return hasTwoBatteries ? WireAction.CUT : WireAction.DONT_CUT;
                } else if (color.equals("blue")) {
                    return hasParallelPort ? WireAction.CUT : WireAction.DONT_CUT;
                } else if (color.equals("red-blue")) {
                    return WireAction.DONT_CUT;
                } else if (color.equals("white")) {
                    return hasTwoBatteries ? WireAction.CUT : WireAction.DONT_CUT;
                }
            } else {
                if (color.equals("red")) {
                    return hasTwoBatteries ? WireAction.CUT : WireAction.DONT_CUT;
                } else if (color.equals("blue")) {
                    return hasParallelPort ? WireAction.CUT : WireAction.DONT_CUT;
                } else if (color.equals("red-blue")) {
                    return isEven ? WireAction.CUT : WireAction.DONT_CUT;
                } else if (color.equals("white")) {
                    return WireAction.DONT_CUT;
                }
            }
        } else {
            if (hasStar) {
                if (color.equals("red")) {
                    return WireAction.CUT;
                } else if (color.equals("blue")) {
                    return WireAction.DONT_CUT;
                } else if (color.equals("red-blue")) {
                    return hasParallelPort ? WireAction.CUT : WireAction.DONT_CUT;
                } else if (color.equals("white")) {
                    return WireAction.CUT;
                }
            } else {
                if (color.equals("red") || color.equals("blue") || color.equals("red-blue")) {
                    return isEven ? WireAction.CUT : WireAction.DONT_CUT;
                } else if (color.equals("white")) {
                    return WireAction.CUT;
                }
            }
        }
        
        // Default action if no conditions are met (should not happen)
        return WireAction.DONT_CUT;
    }
    
    /**
     * Get the last digit of the serial number
     * @param serialNumber The serial number
     * @return The last digit of the serial number, or 0 if no digit is found
     */
    private static int getLastDigit(String serialNumber) {
        for (int i = serialNumber.length() - 1; i >= 0; i--) {
            if (Character.isDigit(serialNumber.charAt(i))) {
                return Character.getNumericValue(serialNumber.charAt(i));
            }
        }
        return 0; // Default if no digit is found
    }
}