package ktanesolver.utils;

import java.util.EnumMap;
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
        this.rowType = rowType;
        this.columnType = columnType;
        this.matrix = new EnumMap<>(rowType);
        
        // Initialize all rows
        for (R row : rowType.getEnumConstants()) {
            matrix.put(row, new EnumMap<>(columnType));
        }
    }
    
    public void put(R row, C column, V value) {
        matrix.get(row).put(column, value);
    }
    
    public V get(R row, C column) {
        return matrix.get(row).get(column);
    }
    
    public boolean contains(R row, C column) {
        return matrix.get(row).containsKey(column);
    }
    
    public EnumMap<C, V> getRow(R row) {
        return new EnumMap<>(matrix.get(row));
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
}
