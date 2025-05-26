package ktanesolver.model.vanilla;

/**
 * Model class for a complicated wire in the Complicated Wires module.
 */
public class ComplicatedWireModel {
    private String color;
    private boolean hasLED;
    private boolean hasStar;
    
    /**
     * Default constructor
     */
    public ComplicatedWireModel() {
        this.color = "";
        this.hasLED = false;
        this.hasStar = false;
    }
    
    /**
     * Constructor with parameters
     * @param color The color of the wire
     * @param hasLED Whether the wire has a lit LED
     * @param hasStar Whether the wire has a star symbol
     */
    public ComplicatedWireModel(String color, boolean hasLED, boolean hasStar) {
        this.color = color.toLowerCase();
        this.hasLED = hasLED;
        this.hasStar = hasStar;
    }
    
    /**
     * Get the color of the wire
     * @return The color
     */
    public String getColor() {
        return color;
    }
    
    /**
     * Set the color of the wire
     * @param color The color
     */
    public void setColor(String color) {
        this.color = color.toLowerCase();
    }
    
    /**
     * Check if the wire has a lit LED
     * @return true if the wire has a lit LED, false otherwise
     */
    public boolean hasLED() {
        return hasLED;
    }
    
    /**
     * Set whether the wire has a lit LED
     * @param hasLED true if the wire has a lit LED, false otherwise
     */
    public void setHasLED(boolean hasLED) {
        this.hasLED = hasLED;
    }
    
    /**
     * Check if the wire has a star symbol
     * @return true if the wire has a star symbol, false otherwise
     */
    public boolean hasStar() {
        return hasStar;
    }
    
    /**
     * Set whether the wire has a star symbol
     * @param hasStar true if the wire has a star symbol, false otherwise
     */
    public void setHasStar(boolean hasStar) {
        this.hasStar = hasStar;
    }
}