package ktanesolver.model.vanilla;

/**
 * Model class for the Button module.
 */
public class ButtonModel {
    private String color;
    private String text;
    
    /**
     * Default constructor
     */
    public ButtonModel() {
        this.color = "";
        this.text = "";
    }
    
    /**
     * Constructor with parameters
     * @param color The color of the button
     * @param text The text on the button
     */
    public ButtonModel(String color, String text) {
        this.color = color.toLowerCase();
        this.text = text.toLowerCase();
    }
    
    /**
     * Get the color of the button
     * @return The color
     */
    public String getColor() {
        return color;
    }
    
    /**
     * Set the color of the button
     * @param color The color
     */
    public void setColor(String color) {
        this.color = color.toLowerCase();
    }
    
    /**
     * Get the text on the button
     * @return The text
     */
    public String getText() {
        return text;
    }
    
    /**
     * Set the text on the button
     * @param text The text
     */
    public void setText(String text) {
        this.text = text.toLowerCase();
    }
}