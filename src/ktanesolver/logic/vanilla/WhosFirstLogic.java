package ktanesolver.logic.vanilla;

import ktanesolver.model.vanilla.WhosOnFirstModel;

/**
 * Logic class for the Who's First module.
 */
public class WhosFirstLogic {
    
    /**
     * Process the Who's First module
     * @param model The Who's First model
     */
    public static void processWhosFirst(WhosOnFirstModel model) {
        // Determine which word to search for based on the display
        determineSearchedWord(model);
        
        // Determine the result based on the searched word
        determineResult(model);
    }
    
    /**
     * Determine which word to search for based on the display
     * @param model The Who's First model
     */
    private static void determineSearchedWord(WhosOnFirstModel model) {
        String display = model.getDisplay();
        String[] words = model.getWords();
        
        switch (display) {
            case "YES", "NOTHING", "LED", "THEY ARE": {
                model.setSearched(words[2]);
                break;
            }
            case "FIRST", "OKAY", "C": {
                model.setSearched(words[1]);
                break;
            }
            case "DISPLAY", "SAYS", "NO", "LEAD", "HOLD ON", "YOU ARE", "THERE", "SEE", "CEE": {
                model.setSearched(words[5]);
                break;
            }
            case "", "REED", "LEED", "THEY'RE": {
                model.setSearched(words[4]);
                break;
            }
            case "BLANK", "READ", "RED", "YOU", "YOUR", "YOU'RE", "THEIR": {
                model.setSearched(words[3]);
                break;
            }
            case "UR": {
                model.setSearched(words[0]);
                break;
            }
            default: {
                model.setSearched("");
                break;
            }
        }
    }
    
    /**
     * Determine the result based on the searched word
     * @param model The Who's First model
     */
    private static void determineResult(WhosOnFirstModel model) {
        String searched = model.getSearched();
        String[] words = model.getWords();
        String[][] wordsList = model.getWordsList();
        
        // Find the row in the wordsList that starts with the searched word
        for (int i = 0; i < wordsList.length; i++) {
            if (wordsList[i][0].equals(searched)) {
                model.setRow(i);
                break;
            }
        }
        
        // Find the first word in the row that matches one of the words on the display
        for (int i = 1; i < wordsList[model.getRow()].length; i++) {
            for (String word : words) {
                if (wordsList[model.getRow()][i].equals(word)) {
                    model.setResult(wordsList[model.getRow()][i]);
                    return;
                }
            }
        }
        
        // If no match is found, set an empty result
        model.setResult("");
    }
}