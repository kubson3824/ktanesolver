package ktanesolver.model.vanilla;

/**
 * Model class for the Simon Says module.
 */
public class SimonSaysModel {
    private String[] inputColors;
    private String[] outputColors;
    private int strikes;
    private boolean hasVowel;
    private String serialNumber;
    
    /**
     * Default constructor
     */
    public SimonSaysModel() {
        this.inputColors = new String[5];
        this.outputColors = new String[5];
        this.strikes = 0;
        this.hasVowel = false;
        this.serialNumber = "";
    }
    
    /**
     * Constructor with parameters
     * @param serialNumber The serial number
     */
    public SimonSaysModel(String serialNumber) {
        this.inputColors = new String[5];
        this.outputColors = new String[5];
        this.strikes = 0;
        this.serialNumber = serialNumber;
        this.hasVowel = checkForVowel(serialNumber);
    }
    
    /**
     * Get the input color for a specific stage
     * @param stage The stage (0-4)
     * @return The input color
     */
    public String getInputColor(int stage) {
        return inputColors[stage];
    }
    
    /**
     * Set the input color for a specific stage
     * @param stage The stage (0-4)
     * @param color The input color
     */
    public void setInputColor(int stage, String color) {
        this.inputColors[stage] = color;
    }
    
    /**
     * Get all input colors
     * @return The input colors
     */
    public String[] getAllInputColors() {
        return inputColors;
    }
    
    /**
     * Set all input colors
     * @param inputColors The input colors
     */
    public void setAllInputColors(String[] inputColors) {
        this.inputColors = inputColors;
    }
    
    /**
     * Get the output color for a specific stage
     * @param stage The stage (0-4)
     * @return The output color
     */
    public String getOutputColor(int stage) {
        return outputColors[stage];
    }
    
    /**
     * Set the output color for a specific stage
     * @param stage The stage (0-4)
     * @param color The output color
     */
    public void setOutputColor(int stage, String color) {
        this.outputColors[stage] = color;
    }
    
    /**
     * Get all output colors
     * @return The output colors
     */
    public String[] getAllOutputColors() {
        return outputColors;
    }
    
    /**
     * Set all output colors
     * @param outputColors The output colors
     */
    public void setAllOutputColors(String[] outputColors) {
        this.outputColors = outputColors;
    }
    
    /**
     * Get the number of strikes
     * @return The number of strikes
     */
    public int getStrikes() {
        return strikes;
    }
    
    /**
     * Set the number of strikes
     * @param strikes The number of strikes
     */
    public void setStrikes(int strikes) {
        this.strikes = strikes;
    }
    
    /**
     * Check if the serial number has a vowel
     * @return true if the serial number has a vowel, false otherwise
     */
    public boolean hasVowel() {
        return hasVowel;
    }
    
    /**
     * Set whether the serial number has a vowel
     * @param hasVowel true if the serial number has a vowel, false otherwise
     */
    public void setHasVowel(boolean hasVowel) {
        this.hasVowel = hasVowel;
    }
    
    /**
     * Get the serial number
     * @return The serial number
     */
    public String getSerialNumber() {
        return serialNumber;
    }
    
    /**
     * Set the serial number
     * @param serialNumber The serial number
     */
    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
        this.hasVowel = checkForVowel(serialNumber);
    }
    
    /**
     * Check if a string contains a vowel
     * @param str The string to check
     * @return true if the string contains a vowel, false otherwise
     */
    private boolean checkForVowel(String str) {
        return str.toUpperCase().matches(".*[AEIOU].*");
    }
}