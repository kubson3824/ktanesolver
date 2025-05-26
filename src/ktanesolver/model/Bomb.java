package ktanesolver.model;

/**
 * Model class representing a bomb and its properties.
 */
public class Bomb {
    private String serialNumber;
    private String[] litIndicators;
    private String[] unlitIndicators;
    private int batteriesAA;
    private int batteriesD;
    private int batteryHolders;
    private int portPlates;
    private int portDVI;
    private int portParallel;
    private int portPS2;
    private int portRJ45;
    private int portSerial;
    private int portStereoRCA;
    private int emptyPortPlates;
    private int startTime;
    private int totalModules;
    private int solvedModules;
    
    // Calculated properties
    private int totalBatteries;
    private int totalPorts;
    private int totalIndicators;
    private int totalPortTypes;
    
    /**
     * Default constructor
     */
    public Bomb() {
        // Initialize with default values
        this.serialNumber = "";
        this.litIndicators = new String[0];
        this.unlitIndicators = new String[0];
    }
    
    /**
     * Calculate derived properties based on the current state
     */
    public void calculateDerivedProperties() {
        // Calculate total batteries
        this.totalBatteries = this.batteriesAA + this.batteriesD;
        
        // Calculate total indicators
        this.totalIndicators = 
            (this.litIndicators == null ? 0 : this.litIndicators.length) + 
            (this.unlitIndicators == null ? 0 : this.unlitIndicators.length);
        
        // Calculate total port types
        this.totalPortTypes = 0;
        if (this.portDVI > 0) this.totalPortTypes++;
        if (this.portPS2 > 0) this.totalPortTypes++;
        if (this.portParallel > 0) this.totalPortTypes++;
        if (this.portRJ45 > 0) this.totalPortTypes++;
        if (this.portSerial > 0) this.totalPortTypes++;
        if (this.portStereoRCA > 0) this.totalPortTypes++;
        
        // Calculate total ports
        this.totalPorts = this.portDVI + this.portPS2 + this.portParallel + 
                          this.portRJ45 + this.portSerial + this.portStereoRCA;
    }
    
    /**
     * Check if a specific indicator is lit
     * @param indicator The indicator to check
     * @return true if the indicator is lit, false otherwise
     */
    public boolean hasLitIndicator(String indicator) {
        if (litIndicators == null) return false;
        
        for (String ind : litIndicators) {
            if (ind.equalsIgnoreCase(indicator)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Check if a specific indicator is unlit
     * @param indicator The indicator to check
     * @return true if the indicator is unlit, false otherwise
     */
    public boolean hasUnlitIndicator(String indicator) {
        if (unlitIndicators == null) return false;
        
        for (String ind : unlitIndicators) {
            if (ind.equalsIgnoreCase(indicator)) {
                return true;
            }
        }
        return false;
    }
    
    // Getters and setters
    
    public String getSerialNumber() {
        return serialNumber;
    }
    
    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }
    
    public char[] getSerialNumberAsChars() {
        return serialNumber.toCharArray();
    }
    
    public String[] getLitIndicators() {
        return litIndicators;
    }
    
    public void setLitIndicators(String[] litIndicators) {
        this.litIndicators = litIndicators;
    }
    
    public String[] getUnlitIndicators() {
        return unlitIndicators;
    }
    
    public void setUnlitIndicators(String[] unlitIndicators) {
        this.unlitIndicators = unlitIndicators;
    }
    
    public int getBatteriesAA() {
        return batteriesAA;
    }
    
    public void setBatteriesAA(int batteriesAA) {
        this.batteriesAA = batteriesAA;
    }
    
    public int getBatteriesD() {
        return batteriesD;
    }
    
    public void setBatteriesD(int batteriesD) {
        this.batteriesD = batteriesD;
    }
    
    public int getBatteryHolders() {
        return batteryHolders;
    }
    
    public void setBatteryHolders(int batteryHolders) {
        this.batteryHolders = batteryHolders;
    }
    
    public int getPortPlates() {
        return portPlates;
    }
    
    public void setPortPlates(int portPlates) {
        this.portPlates = portPlates;
    }
    
    public int getPortDVI() {
        return portDVI;
    }
    
    public void setPortDVI(int portDVI) {
        this.portDVI = portDVI;
    }
    
    public int getPortParallel() {
        return portParallel;
    }
    
    public void setPortParallel(int portParallel) {
        this.portParallel = portParallel;
    }
    
    public int getPortPS2() {
        return portPS2;
    }
    
    public void setPortPS2(int portPS2) {
        this.portPS2 = portPS2;
    }
    
    public int getPortRJ45() {
        return portRJ45;
    }
    
    public void setPortRJ45(int portRJ45) {
        this.portRJ45 = portRJ45;
    }
    
    public int getPortSerial() {
        return portSerial;
    }
    
    public void setPortSerial(int portSerial) {
        this.portSerial = portSerial;
    }
    
    public int getPortStereoRCA() {
        return portStereoRCA;
    }
    
    public void setPortStereoRCA(int portStereoRCA) {
        this.portStereoRCA = portStereoRCA;
    }
    
    public int getEmptyPortPlates() {
        return emptyPortPlates;
    }
    
    public void setEmptyPortPlates(int emptyPortPlates) {
        this.emptyPortPlates = emptyPortPlates;
    }
    
    public int getStartTime() {
        return startTime;
    }
    
    public void setStartTime(int startTime) {
        this.startTime = startTime;
    }
    
    public int getTotalModules() {
        return totalModules;
    }
    
    public void setTotalModules(int totalModules) {
        this.totalModules = totalModules;
    }
    
    public int getSolvedModules() {
        return solvedModules;
    }
    
    public void setSolvedModules(int solvedModules) {
        this.solvedModules = solvedModules;
    }
    
    public int getTotalBatteries() {
        return totalBatteries;
    }
    
    public int getTotalPorts() {
        return totalPorts;
    }
    
    public int getTotalIndicators() {
        return totalIndicators;
    }
    
    public int getTotalPortTypes() {
        return totalPortTypes;
    }
    
    public int getLitIndicatorCount() {
        return litIndicators == null ? 0 : litIndicators.length;
    }
    
    public int getUnlitIndicatorCount() {
        return unlitIndicators == null ? 0 : unlitIndicators.length;
    }
}