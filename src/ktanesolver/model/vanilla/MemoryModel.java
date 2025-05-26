package ktanesolver.model.vanilla;

/**
 * Model class for the Memory module.
 */
public class MemoryModel {
    private int display;
    private int stage;
    private int[] positions;
    private int[] numbers;
    
    /**
     * Default constructor
     */
    public MemoryModel() {
        this.display = 0;
        this.stage = 0;
        this.positions = new int[5]; // 5 stages, but we'll use indices 1-4
        this.numbers = new int[5];   // 5 stages, but we'll use indices 1-4
    }
    
    /**
     * Get the number on the display
     * @return The display number
     */
    public int getDisplay() {
        return display;
    }
    
    /**
     * Set the number on the display
     * @param display The display number
     */
    public void setDisplay(int display) {
        this.display = display;
    }
    
    /**
     * Get the current stage
     * @return The stage
     */
    public int getStage() {
        return stage;
    }
    
    /**
     * Set the current stage
     * @param stage The stage
     */
    public void setStage(int stage) {
        this.stage = stage;
    }
    
    /**
     * Increment the stage
     */
    public void incrementStage() {
        this.stage++;
    }
    
    /**
     * Get the position for a specific stage
     * @param stage The stage
     * @return The position
     */
    public int getPosition(int stage) {
        return positions[stage];
    }
    
    /**
     * Set the position for a specific stage
     * @param stage The stage
     * @param position The position
     */
    public void setPosition(int stage, int position) {
        this.positions[stage] = position;
    }
    
    /**
     * Get the number for a specific stage
     * @param stage The stage
     * @return The number
     */
    public int getNumber(int stage) {
        return numbers[stage];
    }
    
    /**
     * Set the number for a specific stage
     * @param stage The stage
     * @param number The number
     */
    public void setNumber(int stage, int number) {
        this.numbers[stage] = number;
    }
    
    /**
     * Get all positions
     * @return The positions array
     */
    public int[] getPositions() {
        return positions;
    }
    
    /**
     * Get all numbers
     * @return The numbers array
     */
    public int[] getNumbers() {
        return numbers;
    }
}