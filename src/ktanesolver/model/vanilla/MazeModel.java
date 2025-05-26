package ktanesolver.model.vanilla;

/**
 * Model class for the Maze module.
 */
public class MazeModel {
    private String result;
    
    /**
     * Default constructor
     */
    public MazeModel() {
        this.result = "";
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
}