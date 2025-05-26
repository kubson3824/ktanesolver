package ktanesolver.model.vanilla;

/**
 * Model class for the Keypads module.
 */
public class KeypadModel {
    private int[] symbols;
    
    /**
     * Default constructor
     */
    public KeypadModel() {
        this.symbols = new int[0];
    }
    
    /**
     * Constructor with parameters
     * @param symbols The symbols on the keypad
     */
    public KeypadModel(int[] symbols) {
        this.symbols = symbols;
    }
    
    /**
     * Get the symbols on the keypad
     * @return The symbols
     */
    public int[] getSymbols() {
        return symbols;
    }
    
    /**
     * Set the symbols on the keypad
     * @param symbols The symbols
     */
    public void setSymbols(int[] symbols) {
        this.symbols = symbols;
    }
    
    /**
     * Parse a space-separated string of symbol numbers into an array of integers
     * @param input The input string
     * @return The parsed symbols
     */
    public static int[] parseSymbols(String input) {
        String[] parts = input.split(" ");
        int[] symbols = new int[parts.length];
        
        for (int i = 0; i < parts.length; i++) {
            symbols[i] = Integer.parseInt(parts[i]);
        }
        
        return symbols;
    }
}