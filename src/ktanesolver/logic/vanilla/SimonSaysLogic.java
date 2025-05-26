package ktanesolver.logic.vanilla;

import ktanesolver.model.vanilla.SimonSaysModel;

/**
 * Logic class for the Simon Says module.
 */
public class SimonSaysLogic {
    
    /**
     * Determine the output colors based on the input colors, strikes, and whether the serial number has a vowel
     * @param model The Simon Says model
     */
    public static void determineOutputColors(SimonSaysModel model) {
        String[] inputColors = model.getAllInputColors();
        String[] outputColors = new String[inputColors.length];
        
        for (int i = 0; i < inputColors.length; i++) {
            if (inputColors[i] != null && !inputColors[i].equals("-")) {
                outputColors[i] = determineOutputColor(inputColors[i], model.getStrikes(), model.hasVowel());
            } else {
                outputColors[i] = "-";
            }
        }
        
        model.setAllOutputColors(outputColors);
    }
    
    /**
     * Determine the output color for a single input color
     * @param inputColor The input color
     * @param strikes The number of strikes
     * @param hasVowel Whether the serial number has a vowel
     * @return The output color
     */
    private static String determineOutputColor(String inputColor, int strikes, boolean hasVowel) {
        if (hasVowel) {
            return determineOutputColorWithVowel(inputColor, strikes);
        } else {
            return determineOutputColorWithoutVowel(inputColor, strikes);
        }
    }
    
    /**
     * Determine the output color when the serial number has a vowel
     * @param inputColor The input color
     * @param strikes The number of strikes
     * @return The output color
     */
    private static String determineOutputColorWithVowel(String inputColor, int strikes) {
        switch (strikes) {
            case 0:
                switch (inputColor.toLowerCase()) {
                    case "red": return "Blue";
                    case "blue": return "Red";
                    case "green": return "Yellow";
                    case "yellow": return "Green";
                    default: return "-";
                }
            case 1:
                switch (inputColor.toLowerCase()) {
                    case "red": return "Yellow";
                    case "blue": return "Green";
                    case "green": return "Blue";
                    case "yellow": return "Red";
                    default: return "-";
                }
            case 2:
                switch (inputColor.toLowerCase()) {
                    case "red": return "Green";
                    case "blue": return "Red";
                    case "green": return "Yellow";
                    case "yellow": return "Blue";
                    default: return "-";
                }
            default:
                return "-";
        }
    }
    
    /**
     * Determine the output color when the serial number does not have a vowel
     * @param inputColor The input color
     * @param strikes The number of strikes
     * @return The output color
     */
    private static String determineOutputColorWithoutVowel(String inputColor, int strikes) {
        switch (strikes) {
            case 0:
                switch (inputColor.toLowerCase()) {
                    case "red": return "Blue";
                    case "blue": return "Yellow";
                    case "green": return "Green";
                    case "yellow": return "Red";
                    default: return "-";
                }
            case 1:
                switch (inputColor.toLowerCase()) {
                    case "red": return "Red";
                    case "blue": return "Blue";
                    case "green": return "Yellow";
                    case "yellow": return "Green";
                    default: return "-";
                }
            case 2:
                switch (inputColor.toLowerCase()) {
                    case "red": return "Yellow";
                    case "blue": return "Green";
                    case "green": return "Blue";
                    case "yellow": return "Red";
                    default: return "-";
                }
            default:
                return "-";
        }
    }
}