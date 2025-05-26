package ktanesolver.model.vanilla;

/**
 * Model class for the Button Strip module.
 */
public class ButtonStripModel {
    private String stripColor;
    
    /**
     * Default constructor
     */
    public ButtonStripModel() {
        this.stripColor = "";
    }
    
    /**
     * Constructor with parameters
     * @param stripColor The color of the strip
     */
    public ButtonStripModel(String stripColor) {
        this.stripColor = stripColor.toLowerCase();
    }
    
    /**
     * Get the color of the strip
     * @return The color
     */
    public String getStripColor() {
        return stripColor;
    }
    
    /**
     * Set the color of the strip
     * @param stripColor The color
     */
    public void setStripColor(String stripColor) {
        this.stripColor = stripColor.toLowerCase();
    }
}