# Module Implementation Simplification

## Overview
This document outlines the simplified approach for implementing new modules in the ktanesolver project.

## Before vs After

### Before (Current Approach)
- 4 separate files per module
- Boilerplate methods: `getType()`, `inputType()`, `getCatalogInfo()`
- Manual `ModuleCatalogDto` construction
- ~30-40 lines of boilerplate

### After (Simplified Approach)
- 3 files (Solver, Input, Output) - enums as needed
- Single `@ModuleInfo` annotation
- Only `solve()` method to implement
- ~5-10 lines of boilerplate

## Implementation Steps

### 1. Create a New Module

1. **Create Input/Output records** (if needed):
```java
// MyModuleInput.java
public record MyModuleInput(String data) implements ModuleInput {}

// MyModuleOutput.java  
public record MyModuleOutput(String result) implements ModuleOutput {}
```

2. **Create the Solver**:
```java
@Service
@ModuleInfo(
    type = ModuleType.MY_MODULE,
    id = "my-module",
    name = "My Module",
    category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
    description = "Description of what this module does",
    tags = {"puzzle", "logic"}
)
public class MyModuleSolver extends AbstractModuleSolver<MyModuleInput, MyModuleOutput> {
    
    @Override
    public SolveResult<MyModuleOutput> solve(RoundEntity round, BombEntity bomb, 
                                            ModuleEntity module, MyModuleInput input) {
        // Your solving logic here
        return new SolveSuccess<>(new MyModuleOutput("solution"), true);
    }
}
```

### 2. Add ModuleType to Enum
```java
// In ModuleType.java
MY_MODULE(true),
```

### 3. That's it!
- Spring automatically discovers and registers your solver
- The `@ModuleInfo` annotation provides all catalog information
- `AbstractModuleSolver` handles the boilerplate methods automatically

## Migration Guide

To migrate existing modules:
1. Add `@ModuleInfo` annotation with appropriate values
2. Extend `AbstractModuleSolver<I, O>` instead of implementing `ModuleSolver<I, O>`
3. Remove `getType()`, `inputType()`, and `getCatalogInfo()` methods
4. Remove manual `ModuleCatalogDto` construction

## Benefits
- ~70% reduction in boilerplate code
- Centralized module metadata
- Type safety maintained
- Spring integration preserved
- Easier to add new modules
