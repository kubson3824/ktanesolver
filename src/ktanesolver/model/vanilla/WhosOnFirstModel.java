package ktanesolver.model.vanilla;

/**
 * Model class for the Who's First module.
 */
public class WhosOnFirstModel {
    private int row;
    private String display;
    private String searched;
    private String result;
    private String[] words;
    private String[][] wordsList;
    
    /**
     * Default constructor
     */
    public WhosOnFirstModel() {
        this.row = 0;
        this.display = "";
        this.searched = "";
        this.result = "";
        this.words = new String[6];
        this.wordsList = new String[][] {
            {"READY", "YES", "OKAY", "WHAT", "MIDDLE", "LEFT", "PRESS", "RIGHT", "BLANK", "READY"},
            {"FIRST", "LEFT", "OKAY", "YES", "MIDDLE", "NO", "RIGHT", "NOTHING", "UHHH", "WAIT", "READY", "BLANK", "WHAT", "PRESS", "FIRST"},
            {"NO", "BLANK", "UHHH", "WAIT", "FIRST", "WHAT", "READY", "RIGHT", "YES", "NOTHING", "LEFT", "PRESS", "OKAY", "NO"},
            {"BLANK", "WAIT", "RIGHT", "OKAY", "MIDDLE", "BLANK"},
            {"NOTHING", "UHHH", "RIGHT", "OKAY", "MIDDLE", "YES", "BLANK", "NO", "PRESS", "LEFT", "WHAT", "WAIT", "FIRST", "NOTHING"},
            {"YES", "OKAY", "RIGHT", "UHHH", "MIDDLE", "FIRST", "WHAT", "PRESS", "READY", "NOTHING", "YES"},
            {"WHAT", "UHHH", "WHAT"},
            {"UHHH", "READY", "NOTHING", "LEFT", "WHAT", "OKAY", "YES", "RIGHT", "NO", "PRESS", "BLANK", "UHHH"},
            {"LEFT", "RIGHT", "LEFT"},
            {"RIGHT", "YES", "NOTHING", "READY", "PRESS", "NO", "WAIT", "WHAT", "RIGHT"},
            {"MIDDLE", "BLANK", "READY", "OKAY", "WHAT", "NOTHING", "PRESS", "NO", "WAIT", "LEFT", "MIDDLE"},
            {"OKAY", "MIDDLE", "NO", "FIRST", "YES", "UHHH", "NOTHING", "WAIT", "OKAY"},
            {"WAIT", "UHHH", "NO", "BLANK", "OKAY", "YES", "LEFT", "FIRST", "PRESS", "WHAT", "WAIT"},
            {"PRESS", "RIGHT", "MIDDLE", "YES", "READY", "PRESS"},
            {"YOU", "SURE", "YOU ARE", "YOUR", "YOU'RE", "NEXT", "UH HUH", "UR", "HOLD", "WHAT?", "YOU"},
            {"YOU ARE", "YOUR", "NEXT", "LIKE", "UH HUH", "WHAT?", "DONE", "UH UH", "HOLD", "YOU", "U", "YOU'RE", "SURE", "UR", "YOU ARE"},
            {"YOUR", "UH UH", "YOU ARE", "UH HUH", "YOUR"},
            {"YOU'RE", "YOU", "YOU'RE"},
            {"UR", "DONE", "U", "UR"},
            {"U", "UH HUH", "SURE", "NEXT", "WHAT?", "YOU'RE", "UR", "UH UH", "DONE", "U"},
            {"UH HUH", "UH HUH"},
            {"UH UH", "UR", "U", "YOU ARE", "YOU'RE", "NEXT", "UH UH"},
            {"WHAT?", "YOU", "HOLD", "YOU'RE", "YOUR", "U", "DONE", "UH UH", "LIKE", "YOU ARE", "UH HUH", "UR", "NEXT", "WHAT?"},
            {"DONE", "SURE", "UH HUH", "NEXT", "WHAT?", "YOUR", "UR", "YOU'RE", "HOLD", "LIKE", "YOU", "U", "YOU ARE", "UH UH", "DONE"},
            {"NEXT", "WHAT?", "UH HUH", "UH UH", "YOUR", "HOLD", "SURE", "NEXT"},
            {"HOLD", "YOU ARE", "U", "DONE", "UH UH", "YOU", "UR", "SURE", "WHAT?", "YOU'RE", "NEXT", "HOLD"},
            {"SURE", "YOU ARE", "DONE", "LIKE", "YOU'RE", "YOU", "HOLD", "UH HUH", "UR", "SURE"},
            {"LIKE", "YOU'RE", "NEXT", "U", "UR", "HOLD", "DONE", "UH UH", "WHAT?", "UH HUH", "YOU", "LIKE"}
        };
    }
    
    /**
     * Get the row
     * @return The row
     */
    public int getRow() {
        return row;
    }
    
    /**
     * Set the row
     * @param row The row
     */
    public void setRow(int row) {
        this.row = row;
    }
    
    /**
     * Get the display
     * @return The display
     */
    public String getDisplay() {
        return display;
    }
    
    /**
     * Set the display
     * @param display The display
     */
    public void setDisplay(String display) {
        this.display = display;
    }
    
    /**
     * Get the searched word
     * @return The searched word
     */
    public String getSearched() {
        return searched;
    }
    
    /**
     * Set the searched word
     * @param searched The searched word
     */
    public void setSearched(String searched) {
        this.searched = searched;
    }
    
    /**
     * Get the result
     * @return The result
     */
    public String getResult() {
        return result;
    }
    
    /**
     * Set the result
     * @param result The result
     */
    public void setResult(String result) {
        this.result = result;
    }
    
    /**
     * Get the words
     * @return The words
     */
    public String[] getWords() {
        return words;
    }
    
    /**
     * Set the words
     * @param words The words
     */
    public void setWords(String[] words) {
        this.words = words;
    }
    
    /**
     * Get a specific word
     * @param index The index
     * @return The word
     */
    public String getWord(int index) {
        return words[index];
    }
    
    /**
     * Set a specific word
     * @param index The index
     * @param word The word
     */
    public void setWord(int index, String word) {
        this.words[index] = word;
    }
    
    /**
     * Get the words list
     * @return The words list
     */
    public String[][] getWordsList() {
        return wordsList;
    }
    
    /**
     * Set the words list
     * @param wordsList The words list
     */
    public void setWordsList(String[][] wordsList) {
        this.wordsList = wordsList;
    }
}