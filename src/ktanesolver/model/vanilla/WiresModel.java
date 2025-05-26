package ktanesolver.model.vanilla;

/**
 * Model class for the Wires module.
 */
public class WiresModel {
    private int redCount;
    private int blueCount;
    private int yellowCount;
    private int whiteCount;
    private int blackCount;
    private String[] input;
    private String[] wires;
    private char[] serial;
    private int lastDigit;
    private int wireCount;
    private String result;
    
    /**
     * Default constructor
     */
    public WiresModel() {
        this.input = new String[6];
        this.redCount = 0;
        this.blueCount = 0;
        this.yellowCount = 0;
        this.whiteCount = 0;
        this.blackCount = 0;
        this.wireCount = 0;
        this.lastDigit = 0;
        this.result = "";
    }
    
    /**
     * Constructor with serial number
     * @param serial The serial number
     */
    public WiresModel(char[] serial) {
        this();
        this.serial = serial;
    }
    
    /**
     * Get the count of red wires
     * @return The count of red wires
     */
    public int getRedCount() {
        return redCount;
    }
    
    /**
     * Set the count of red wires
     * @param redCount The count of red wires
     */
    public void setRedCount(int redCount) {
        this.redCount = redCount;
    }
    
    /**
     * Get the count of blue wires
     * @return The count of blue wires
     */
    public int getBlueCount() {
        return blueCount;
    }
    
    /**
     * Set the count of blue wires
     * @param blueCount The count of blue wires
     */
    public void setBlueCount(int blueCount) {
        this.blueCount = blueCount;
    }
    
    /**
     * Get the count of yellow wires
     * @return The count of yellow wires
     */
    public int getYellowCount() {
        return yellowCount;
    }
    
    /**
     * Set the count of yellow wires
     * @param yellowCount The count of yellow wires
     */
    public void setYellowCount(int yellowCount) {
        this.yellowCount = yellowCount;
    }
    
    /**
     * Get the count of white wires
     * @return The count of white wires
     */
    public int getWhiteCount() {
        return whiteCount;
    }
    
    /**
     * Set the count of white wires
     * @param whiteCount The count of white wires
     */
    public void setWhiteCount(int whiteCount) {
        this.whiteCount = whiteCount;
    }
    
    /**
     * Get the count of black wires
     * @return The count of black wires
     */
    public int getBlackCount() {
        return blackCount;
    }
    
    /**
     * Set the count of black wires
     * @param blackCount The count of black wires
     */
    public void setBlackCount(int blackCount) {
        this.blackCount = blackCount;
    }
    
    /**
     * Get the input array
     * @return The input array
     */
    public String[] getInput() {
        return input;
    }
    
    /**
     * Set the input array
     * @param input The input array
     */
    public void setInput(String[] input) {
        this.input = input;
    }
    
    /**
     * Get the wires array
     * @return The wires array
     */
    public String[] getWires() {
        return wires;
    }
    
    /**
     * Set the wires array
     * @param wires The wires array
     */
    public void setWires(String[] wires) {
        this.wires = wires;
    }
    
    /**
     * Get the serial number
     * @return The serial number
     */
    public char[] getSerial() {
        return serial;
    }
    
    /**
     * Set the serial number
     * @param serial The serial number
     */
    public void setSerial(char[] serial) {
        this.serial = serial;
    }
    
    /**
     * Get the last digit of the serial number
     * @return The last digit
     */
    public int getLastDigit() {
        return lastDigit;
    }
    
    /**
     * Set the last digit of the serial number
     * @param lastDigit The last digit
     */
    public void setLastDigit(int lastDigit) {
        this.lastDigit = lastDigit;
    }
    
    /**
     * Get the wire count
     * @return The wire count
     */
    public int getWireCount() {
        return wireCount;
    }
    
    /**
     * Set the wire count
     * @param wireCount The wire count
     */
    public void setWireCount(int wireCount) {
        this.wireCount = wireCount;
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