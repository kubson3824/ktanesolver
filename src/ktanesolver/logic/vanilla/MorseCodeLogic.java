package ktanesolver.logic.vanilla;

import ktanesolver.model.vanilla.MorseCodeModel;

/**
 * Logic class for the Morse Code module.
 */
public class MorseCodeLogic {
    
    /**
     * Decode the Morse code and determine the frequency
     * @param model The Morse code model
     */
    public static void decodeAndDetermineFrequency(MorseCodeModel model) {
        String morseCode = model.getMorseCode();
        
        // Split the Morse code into individual codes
        String[] splitCode = morseCode.split(" ");
        
        // Decode each code into a letter
        StringBuilder decodedWord = new StringBuilder();
        for (String code : splitCode) {
            decodedWord.append(decodeLetter(code));
        }
        
        // Set the decoded word in the model
        model.setDecodedWord(decodedWord.toString());
        
        // Determine the frequency based on the decoded word
        model.setFrequency(determineFrequency(decodedWord.toString()));
    }
    
    /**
     * Decode a Morse code into a letter
     * @param code The Morse code
     * @return The decoded letter
     */
    private static String decodeLetter(String code) {
        switch (code) {
            case ".-": return "a";
            case "-...": return "b";
            case "-.-.": return "c";
            case "-..": return "d";
            case ".": return "e";
            case "..-.": return "f";
            case "--.": return "g";
            case "....": return "h";
            case "..": return "i";
            case ".---": return "j";
            case "-.-": return "k";
            case ".-..": return "l";
            case "--": return "m";
            case "-.": return "n";
            case "---": return "o";
            case ".--.": return "p";
            case "--.-": return "q";
            case ".-.": return "r";
            case "...": return "s";
            case "-": return "t";
            case "..-": return "u";
            case "...-": return "v";
            case ".--": return "w";
            case "-..-": return "x";
            case "-.--": return "y";
            case "--..": return "z";
            case ".----": return "1";
            case "..---": return "2";
            case "...--": return "3";
            case "....-": return "4";
            case ".....": return "5";
            case "-....": return "6";
            case "--...": return "7";
            case "---..": return "8";
            case "----.": return "9";
            case "-----": return "0";
            default: return "";
        }
    }
    
    /**
     * Determine the frequency based on the decoded word
     * @param word The decoded word
     * @return The frequency
     */
    private static String determineFrequency(String word) {
        switch (word) {
            case "shell": return "3.505 MHz";
            case "halls": return "3.515 MHz";
            case "slick": return "3.522 MHz";
            case "trick": return "3.532 MHz";
            case "boxes": return "3.535 MHz";
            case "leaks": return "3.542 MHz";
            case "strobe": return "3.545 MHz";
            case "bistro": return "3.552 MHz";
            case "flick": return "3.555 MHz";
            case "bombs": return "3.565 MHz";
            case "break": return "3.572 MHz";
            case "brick": return "3.575 MHz";
            case "steak": return "3.582 MHz";
            case "sting": return "3.592 MHz";
            case "vector": return "3.595 MHz";
            case "beats": return "3.600 MHz";
            default: return "";
        }
    }
}