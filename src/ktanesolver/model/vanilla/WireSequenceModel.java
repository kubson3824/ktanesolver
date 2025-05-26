package ktanesolver.model.vanilla;

/**
 * Model class for the Wire Sequence module.
 */
public class WireSequenceModel {
    private int redCount;
    private int blueCount;
    private int blackCount;
    private String[] redOccurrences;
    private String[] blueOccurrences;
    private String[] blackOccurrences;
    private String color;
    private String letter;
    private String result;
    
    /**
     * Default constructor
     */
    public WireSequenceModel() {
        this.redCount = 0;
        this.blueCount = 0;
        this.blackCount = 0;
        this.redOccurrences = new String[]{"C", "B", "A", "A,C", "B", "A,C", "A,B,C", "A,B", "B"};
        this.blueOccurrences = new String[]{"B", "A,C", "B", "A", "B", "B,C", "C", "A,C", "A"};
        this.blackOccurrences = new String[]{"A,B,C", "A,C", "B", "A,C", "B", "B,C", "A,B", "C", "C"};
        this.color = "";
        this.letter = "";
        this.result = "";
    }
    
    /**
     * Get the red wire count
     * @return The red wire count
     */
    public int getRedCount() {
        return redCount;
    }
    
    /**
     * Set the red wire count
     * @param redCount The red wire count
     */
    public void setRedCount(int redCount) {
        this.redCount = redCount;
    }
    
    /**
     * Get the blue wire count
     * @return The blue wire count
     */
    public int getBlueCount() {
        return blueCount;
    }
    
    /**
     * Set the blue wire count
     * @param blueCount The blue wire count
     */
    public void setBlueCount(int blueCount) {
        this.blueCount = blueCount;
    }
    
    /**
     * Get the black wire count
     * @return The black wire count
     */
    public int getBlackCount() {
        return blackCount;
    }
    
    /**
     * Set the black wire count
     * @param blackCount The black wire count
     */
    public void setBlackCount(int blackCount) {
        this.blackCount = blackCount;
    }
    
    /**
     * Get the red occurrences
     * @return The red occurrences
     */
    public String[] getRedOccurrences() {
        return redOccurrences;
    }
    
    /**
     * Set the red occurrences
     * @param redOccurrences The red occurrences
     */
    public void setRedOccurrences(String[] redOccurrences) {
        this.redOccurrences = redOccurrences;
    }
    
    /**
     * Get the blue occurrences
     * @return The blue occurrences
     */
    public String[] getBlueOccurrences() {
        return blueOccurrences;
    }
    
    /**
     * Set the blue occurrences
     * @param blueOccurrences The blue occurrences
     */
    public void setBlueOccurrences(String[] blueOccurrences) {
        this.blueOccurrences = blueOccurrences;
    }
    
    /**
     * Get the black occurrences
     * @return The black occurrences
     */
    public String[] getBlackOccurrences() {
        return blackOccurrences;
    }
    
    /**
     * Set the black occurrences
     * @param blackOccurrences The black occurrences
     */
    public void setBlackOccurrences(String[] blackOccurrences) {
        this.blackOccurrences = blackOccurrences;
    }
    
    /**
     * Get the color
     * @return The color
     */
    public String getColor() {
        return color;
    }
    
    /**
     * Set the color
     * @param color The color
     */
    public void setColor(String color) {
        this.color = color;
    }
    
    /**
     * Get the letter
     * @return The letter
     */
    public String getLetter() {
        return letter;
    }
    
    /**
     * Set the letter
     * @param letter The letter
     */
    public void setLetter(String letter) {
        this.letter = letter;
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
     * Reset the counters
     */
    public void reset() {
        this.redCount = 0;
        this.blueCount = 0;
        this.blackCount = 0;
    }
}