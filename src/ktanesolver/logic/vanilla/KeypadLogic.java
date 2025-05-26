package ktanesolver.logic.vanilla;

import ktanesolver.model.vanilla.KeypadModel;

/**
 * Logic class for the Keypads module.
 */
public class KeypadLogic {
    
    // Symbol lists for determining the order
    private static final int[][] SYMBOL_LISTS = {
        {1, 2, 3, 4, 5, 6, 7},
        {8, 1, 7, 9, 10, 6, 11},
        {12, 13, 9, 14, 15, 3, 10},
        {16, 17, 18, 5, 14, 11, 19},
        {20, 19, 18, 21, 17, 22, 23},
        {16, 8, 24, 25, 20, 26, 27}
    };
    
    /**
     * Determine the correct order of symbols based on the predefined lists
     * @param keypad The keypad model
     * @return The ordered symbols
     */
    public static int[] determineOrder(KeypadModel keypad) {
        int[] symbols = keypad.getSymbols();
        
        // Find the row that contains all the symbols
        int bestRow = findBestRow(symbols);
        
        // Order the symbols based on the best row
        return orderSymbols(symbols, bestRow);
    }
    
    /**
     * Find the row in the symbol lists that contains all the symbols
     * @param symbols The symbols to check
     * @return The index of the row that contains all the symbols
     */
    private static int findBestRow(int[] symbols) {
        for (int row = 0; row < SYMBOL_LISTS.length; row++) {
            int matchCount = 0;
            
            for (int symbol : symbols) {
                for (int listSymbol : SYMBOL_LISTS[row]) {
                    if (symbol == listSymbol) {
                        matchCount++;
                        break;
                    }
                }
            }
            
            if (matchCount == symbols.length) {
                return row;
            }
        }
        
        // Default to the first row if no match is found
        return 0;
    }
    
    /**
     * Order the symbols based on the specified row in the symbol lists
     * @param symbols The symbols to order
     * @param row The row to use for ordering
     * @return The ordered symbols
     */
    private static int[] orderSymbols(int[] symbols, int row) {
        int[] orderedSymbols = new int[symbols.length];
        int index = 0;
        
        for (int listSymbol : SYMBOL_LISTS[row]) {
            for (int symbol : symbols) {
                if (symbol == listSymbol) {
                    orderedSymbols[index++] = symbol;
                    break;
                }
            }
            
            if (index == symbols.length) {
                break;
            }
        }
        
        return orderedSymbols;
    }
    
    /**
     * Get the image path for a symbol
     * @param symbol The symbol number
     * @return The image path
     */
    public static String getImagePath(int symbol) {
        return "/KTANEResources/S" + symbol + ".jpg";
    }
}