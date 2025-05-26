package ktanesolver.model.vanilla;

/**
 * Model class for the Morse Code module.
 */
public class MorseCodeModel {
    private String morseCode;
    private String decodedWord;
    private String frequency;
    
    /**
     * Default constructor
     */
    public MorseCodeModel() {
        this.morseCode = "";
        this.decodedWord = "";
        this.frequency = "";
    }
    
    /**
     * Constructor with parameters
     * @param morseCode The Morse code
     */
    public MorseCodeModel(String morseCode) {
        this.morseCode = morseCode;
        this.decodedWord = "";
        this.frequency = "";
    }
    
    /**
     * Get the Morse code
     * @return The Morse code
     */
    public String getMorseCode() {
        return morseCode;
    }
    
    /**
     * Set the Morse code
     * @param morseCode The Morse code
     */
    public void setMorseCode(String morseCode) {
        this.morseCode = morseCode;
    }
    
    /**
     * Get the decoded word
     * @return The decoded word
     */
    public String getDecodedWord() {
        return decodedWord;
    }
    
    /**
     * Set the decoded word
     * @param decodedWord The decoded word
     */
    public void setDecodedWord(String decodedWord) {
        this.decodedWord = decodedWord;
    }
    
    /**
     * Get the frequency
     * @return The frequency
     */
    public String getFrequency() {
        return frequency;
    }
    
    /**
     * Set the frequency
     * @param frequency The frequency
     */
    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }
}