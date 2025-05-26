package ktanesolver.logic.vanilla;

import ktanesolver.model.vanilla.PasswordModel;

/**
 * Logic class for the Passwords module.
 */
public class PasswordLogic {
    
    // List of possible passwords
    private static final String[] POSSIBLE_PASSWORDS = {
        "about", "after", "again", "below", "could",
        "every", "first", "found", "great", "house",
        "large", "learn", "never", "other", "place",
        "plant", "point", "right", "small", "sound",
        "spell", "still", "study", "their", "there",
        "these", "thing", "think", "three", "water",
        "where", "which", "world", "would", "write"
    };
    
    /**
     * Determine the password based on the letters in each column
     * @param model The password model
     */
    public static void determinePassword(PasswordModel model) {
        String[] columnLetters = model.getAllColumnLetters();
        
        // Convert all letters to lowercase
        for (int i = 0; i < columnLetters.length; i++) {
            columnLetters[i] = columnLetters[i].toLowerCase();
        }
        
        // Find all possible words for each position
        String[] possibleWords = findPossibleWords(columnLetters);
        
        // Set the password in the model
        if (possibleWords.length > 0) {
            model.setPassword(possibleWords[0]);
        } else {
            model.setPassword("No password found");
        }
    }
    
    /**
     * Find all possible words based on the letters in each column
     * @param columnLetters The letters in each column
     * @return The possible words
     */
    private static String[] findPossibleWords(String[] columnLetters) {
        // Arrays to store possible words for each position
        String[][] possibleWords = new String[5][POSSIBLE_PASSWORDS.length];
        int[] counts = new int[5];
        
        // Find all possible words for the first position
        for (int i = 0; i < columnLetters[0].length(); i++) {
            char letter = columnLetters[0].charAt(i);
            for (String word : POSSIBLE_PASSWORDS) {
                if (word.charAt(0) == letter) {
                    possibleWords[0][counts[0]] = word;
                    counts[0]++;
                }
            }
        }
        
        // Find all possible words for the remaining positions
        for (int pos = 1; pos < 5; pos++) {
            for (int i = 0; i < counts[pos - 1]; i++) {
                String word = possibleWords[pos - 1][i];
                for (int j = 0; j < columnLetters[pos].length(); j++) {
                    char letter = columnLetters[pos].charAt(j);
                    if (word.charAt(pos) == letter) {
                        possibleWords[pos][counts[pos]] = word;
                        counts[pos]++;
                        break;
                    }
                }
            }
        }
        
        // Create an array with the final possible words
        String[] result = new String[counts[4]];
        for (int i = 0; i < counts[4]; i++) {
            result[i] = possibleWords[4][i];
        }
        
        return result;
    }
}