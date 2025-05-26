package ktanesolver.model.vanilla;

/**
 * Model class for the Passwords module.
 */
public class PasswordModel {
    private String[] columnLetters;
    private String password;
    
    /**
     * Default constructor
     */
    public PasswordModel() {
        this.columnLetters = new String[5];
        this.password = "";
    }
    
    /**
     * Constructor with parameters
     * @param columnLetters The letters in each column
     */
    public PasswordModel(String[] columnLetters) {
        this.columnLetters = columnLetters;
        this.password = "";
    }
    
    /**
     * Get the letters in a specific column
     * @param column The column index (0-4)
     * @return The letters in the column
     */
    public String getColumnLetters(int column) {
        return columnLetters[column];
    }
    
    /**
     * Set the letters in a specific column
     * @param column The column index (0-4)
     * @param letters The letters in the column
     */
    public void setColumnLetters(int column, String letters) {
        this.columnLetters[column] = letters;
    }
    
    /**
     * Get all column letters
     * @return The letters in all columns
     */
    public String[] getAllColumnLetters() {
        return columnLetters;
    }
    
    /**
     * Set all column letters
     * @param columnLetters The letters in all columns
     */
    public void setAllColumnLetters(String[] columnLetters) {
        this.columnLetters = columnLetters;
    }
    
    /**
     * Get the password
     * @return The password
     */
    public String getPassword() {
        return password;
    }
    
    /**
     * Set the password
     * @param password The password
     */
    public void setPassword(String password) {
        this.password = password;
    }
}