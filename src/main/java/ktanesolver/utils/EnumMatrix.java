package ktanesolver.utils;

import java.util.EnumMap;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;

/**
 * A two-dimensional structure with enum keys for both dimensions.
 * Provides type-safe and efficient enum-based indexing.
 */
public class EnumMatrix<R extends Enum<R>, C extends Enum<C>, V> {
    private final EnumMap<R, EnumMap<C, V>> matrix;
    private final Class<R> rowType;
    private final Class<C> columnType;
    
    public EnumMatrix(Class<R> rowType, Class<C> columnType) {
        this.rowType = Objects.requireNonNull(rowType);
        this.columnType = Objects.requireNonNull(columnType);
        this.matrix = new EnumMap<>(rowType);
        
        // Initialize all rows
        for (R row : rowType.getEnumConstants()) {
            matrix.put(row, new EnumMap<>(columnType));
        }
    }
    
    /**
     * Sets a value at the specified row and column.
     *
     * @param row the row enum
     * @param column the column enum
     * @param value the value to store
     */
    public void set(R row, C column, V value) {
        Objects.requireNonNull(row);
        Objects.requireNonNull(column);
        matrix.get(row).put(column, value);
    }
    
    /**
     * Sets a value at the specified row and column.
     *
     * @param row the row enum
     * @param column the column enum
     * @param value the value to store
     */
    public void put(R row, C column, V value) {
        Objects.requireNonNull(row);
        Objects.requireNonNull(column);
        matrix.get(row).put(column, value);
    }
    
    /**
     * Gets the value at the specified row and column.
     *
     * @param row the row enum
     * @param column the column enum
     * @return the value at the specified position, or null if not set
     */
    public V get(R row, C column) {
        Objects.requireNonNull(row);
        Objects.requireNonNull(column);
        return matrix.get(row).get(column);
    }
    
    /**
     * Checks if a value exists at the specified row and column.
     *
     * @param row the row enum
     * @param column the column enum
     * @return true if a value exists at the specified position
     */
    public boolean contains(R row, C column) {
        Objects.requireNonNull(row);
        Objects.requireNonNull(column);
        return matrix.get(row).containsKey(column);
    }
    
    /**
     * Removes the value at the specified row and column.
     *
     * @param row the row enum
     * @param column the column enum
     * @return the removed value, or null if no value was present
     */
    public V remove(R row, C column) {
        Objects.requireNonNull(row);
        Objects.requireNonNull(column);
        return matrix.get(row).remove(column);
    }
    
    /**
     * Gets all values in the specified row.
     *
     * @param row the row enum
     * @return an immutable map of columns to values for the specified row
     */
    public EnumMap<C, V> getRow(R row) {
        Objects.requireNonNull(row);
        return new EnumMap<>(matrix.get(row));
    }
    
    /**
     * Gets all values in the specified column.
     *
     * @param column the column enum
     * @return a map of rows to values for the specified column
     */
    public Map<R, V> getColumn(C column) {
        Objects.requireNonNull(column);
        Map<R, V> result = new EnumMap<>(rowType);
        for (R row : rowType.getEnumConstants()) {
            V value = matrix.get(row).get(column);
            if (value != null) {
                result.put(row, value);
            }
        }
        return result;
    }
    
    /**
     * Clears all values from the matrix.
     */
    public void clear() {
        for (R row : rowType.getEnumConstants()) {
            matrix.get(row).clear();
        }
    }
    
    /**
     * Returns the number of rows in the matrix.
     *
     * @return the number of rows
     */
    public int getRowCount() {
        return rowType.getEnumConstants().length;
    }
    
    /**
     * Returns the number of columns in the matrix.
     *
     * @return the number of columns
     */
    public int getColumnCount() {
        return columnType.getEnumConstants().length;
    }
    
    /**
     * Returns all row enum constants.
     *
     * @return array of row enum constants
     */
    public R[] getRows() {
        return rowType.getEnumConstants();
    }
    
    /**
     * Returns all column enum constants.
     *
     * @return array of column enum constants
     */
    public C[] getColumns() {
        return columnType.getEnumConstants();
    }
    
    /**
     * Creates a deep copy of this matrix.
     *
     * @return a new EnumMatrix with the same data
     */
    public EnumMatrix<R, C, V> copy() {
        EnumMatrix<R, C, V> copy = new EnumMatrix<>(rowType, columnType);
        for (R row : rowType.getEnumConstants()) {
            for (Map.Entry<C, V> entry : matrix.get(row).entrySet()) {
                copy.set(row, entry.getKey(), entry.getValue());
            }
        }
        return copy;
    }
    
    /**
     * Fill the matrix with values using a generator function
     */
    public void fill(Function<R, Function<C, V>> valueGenerator) {
        for (R row : rowType.getEnumConstants()) {
            for (C column : columnType.getEnumConstants()) {
                put(row, column, valueGenerator.apply(row).apply(column));
            }
        }
    }
    
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("EnumMatrix[rows=").append(rowType.getSimpleName())
          .append(", columns=").append(columnType.getSimpleName())
          .append("]\n");
        
        // Print header
        sb.append("\t");
        for (C column : columnType.getEnumConstants()) {
            sb.append(column).append("\t");
        }
        sb.append("\n");
        
        // Print rows
        for (R row : rowType.getEnumConstants()) {
            sb.append(row).append("\t");
            for (C column : columnType.getEnumConstants()) {
                V value = matrix.get(row).get(column);
                sb.append(value != null ? value : "null").append("\t");
            }
            sb.append("\n");
        }
        
        return sb.toString();
    }
}
