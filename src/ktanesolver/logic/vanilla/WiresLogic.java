package ktanesolver.logic.vanilla;

import ktanesolver.model.vanilla.WiresModel;

/**
 * Logic class for the Wires module.
 */
public class WiresLogic {
    
    /**
     * Process the input and determine which wire to cut
     * @param model The wires model
     */
    public static void processWires(WiresModel model) {
        // Reset counters
        model.setRedCount(0);
        model.setBlueCount(0);
        model.setBlackCount(0);
        model.setYellowCount(0);
        model.setWhiteCount(0);
        model.setWireCount(0);
        
        // Find the last digit in the serial number
        char[] serial = model.getSerial();
        for(int i = serial.length - 1; i >= 0; i--) {
            if(Character.isDigit(serial[i])) {
                model.setLastDigit(Character.getNumericValue(serial[i]));
                break;
            }
        }
        
        // Count the wires
        String[] input = model.getInput();
        for (String wire : input) {
            if (!wire.equals("-")) {
                model.setWireCount(model.getWireCount() + 1);
            }
        }
        
        // Create the wires array
        String[] wires = new String[model.getWireCount()];
        System.arraycopy(input, 0, wires, 0, wires.length);
        model.setWires(wires);
        
        // Count the colors
        for (String wire : wires) {
            if (wire.equals("red")) {
                model.setRedCount(model.getRedCount() + 1);
            }
            if (wire.equals("blue")) {
                model.setBlueCount(model.getBlueCount() + 1);
            }
            if (wire.equals("black")) {
                model.setBlackCount(model.getBlackCount() + 1);
            }
            if (wire.equals("yellow")) {
                model.setYellowCount(model.getYellowCount() + 1);
            }
            if (wire.equals("white")) {
                model.setWhiteCount(model.getWhiteCount() + 1);
            }
        }
        
        // Determine which wire to cut based on the number of wires
        switch(wires.length) {
            case 3:
                wires3(model);
                break;
            case 4:
                wires4(model);
                break;
            case 5:
                wires5(model);
                break;
            case 6:
                wires6(model);
                break;
            default:
                model.setResult("Invalid number of wires");
        }
    }
    
    /**
     * Logic for 3 wires
     * @param model The wires model
     */
    private static void wires3(WiresModel model) {
        String[] wires = model.getWires();
        
        if(model.getRedCount() == 0) {
            model.setResult("Cut the second wire");
        } else if(wires[2].equals("white")) {
            model.setResult("Cut the last wire");
        } else if(model.getBlueCount() > 1) {
            model.setResult("Cut the last blue wire");
        } else {
            model.setResult("Cut the last wire");
        }
    }
    
    /**
     * Logic for 4 wires
     * @param model The wires model
     */
    private static void wires4(WiresModel model) {
        String[] wires = model.getWires();
        
        if(model.getRedCount() > 1 && model.getLastDigit() % 2 == 1) {
            model.setResult("Cut the last red wire");
        } else if(wires[3].equals("yellow") && model.getRedCount() == 0) {
            model.setResult("Cut the first wire");
        } else if(model.getBlueCount() == 1) {
            model.setResult("Cut the first wire");
        } else if(model.getYellowCount() > 1) {
            model.setResult("Cut the last wire");
        } else {
            model.setResult("Cut the second wire");
        }
    }
    
    /**
     * Logic for 5 wires
     * @param model The wires model
     */
    private static void wires5(WiresModel model) {
        String[] wires = model.getWires();
        
        if(wires[4].equals("black") && model.getLastDigit() % 2 == 1) {
            model.setResult("Cut the fourth wire");
        } else if(model.getRedCount() == 1 && model.getYellowCount() > 1) {
            model.setResult("Cut the first wire");
        } else if(model.getBlackCount() == 0) {
            model.setResult("Cut the second wire");
        } else {
            model.setResult("Cut the first wire");
        }
    }
    
    /**
     * Logic for 6 wires
     * @param model The wires model
     */
    private static void wires6(WiresModel model) {
        if(model.getYellowCount() == 0 && model.getLastDigit() % 2 == 1) {
            model.setResult("Cut the third wire");
        } else if(model.getYellowCount() == 1 && model.getWhiteCount() > 1) {
            model.setResult("Cut the fourth wire");
        } else if(model.getRedCount() == 0) {
            model.setResult("Cut the last wire");
        } else {
            model.setResult("Cut the fourth wire");
        }
    }
}