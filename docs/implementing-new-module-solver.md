# Implementing a New Module Solver

This guide walks you through creating a new module solver for both the backend (Java) and frontend (TypeScript/React).

## Overview

The KTANE Solver follows a clear pattern for module implementation:
- Backend: Java classes extending `AbstractModuleSolver`
- Frontend: React components with corresponding service files
- Registration: Automatic via Spring's dependency injection

## Backend Implementation

### Step 1: Add Module Type to Enum

First, add your module type to `ModuleType.java`:

```java
// src/main/java/ktanesolver/enums/ModuleType.java
public enum ModuleType {
    // ... existing types
    YOUR_NEW_MODULE(false),  // true for needy modules, false for regular
}
```

### Step 2: Create Input and Output Classes

Create input and output records in your module's package:

```java
// src/main/java/ktanesolver/module/modded/regular/yourmodule/YourModuleInput.java
package ktanesolver.module.modded.regular.yourmodule;

import ktanesolver.logic.ModuleInput;

public record YourModuleInput(
    String field1,
    int field2,
    boolean field3
) implements ModuleInput {
}
```

```java
// src/main/java/ktanesolver/module/modded/regular/yourmodule/YourModuleOutput.java
package ktanesolver.module.modded.regular.yourmodule;

import ktanesolver.logic.ModuleOutput;

public record YourModuleOutput(
    String solution,
    int score
) implements ModuleOutput {
}
```

### Step 3: Create Enum Types (if needed)

If your module uses enums, create them in separate files:

```java
// src/main/java/ktanesolver/module/modded/regular/yourmodule/YourModuleType.java
package ktanesolver.module.modded.regular.yourmodule;

public enum YourModuleType {
    TYPE_A,
    TYPE_B,
    TYPE_C
}
```

### Step 4: Implement the Solver Class

Create the main solver class:

```java
// src/main/java/ktanesolver/module/modded/regular/yourmodule/YourModuleSolver.java
package ktanesolver.module.modded.regular.yourmodule;

import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
    type = ModuleType.YOUR_NEW_MODULE,
    id = "your-module-id",
    name = "Your Module Name",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Brief description of what this module does",
    tags = {"tag1", "tag2"},
    hasInput = true,
    hasOutput = true
)
public class YourModuleSolver extends AbstractModuleSolver<YourModuleInput, YourModuleOutput> {
    
    @Override
    protected SolveResult<YourModuleOutput> doSolve(
        RoundEntity round, 
        BombEntity bomb, 
        ModuleEntity module, 
        YourModuleInput input
    ) {
        // Validate input
        if (input.field1() == null || input.field1().isEmpty()) {
            return failure("Field 1 is required");
        }
        
        // Store state if needed for multi-step modules
        storeState(module, "lastInput", input.field1());
        
        // Your solving logic here
        String solution = solveModule(input, bomb);
        int score = calculateScore(input);
        
        // Return success with output
        return success(new YourModuleOutput(solution, score));
    }
    
    private String solveModule(YourModuleInput input, BombEntity bomb) {
        // Implement your module's solving logic
        // Access bomb properties like:
        // - bomb.getSerialNumber()
        // - bomb.getIndicators()
        // - bomb.getPortPlates()
        // - bomb.getAaBatteryCount()
        // - bomb.getDBatteryCount()
        return "solution";
    }
    
    private int calculateScore(YourModuleInput input) {
        // Helper method for scoring
        return 0;
    }
}
```

### Key Backend Features

1. **Helper Methods**:
   - `success(output)` - Mark module as solved
   - `success(output, false)` - Return output without marking as solved
   - `failure(message)` - Return error message

2. **State Management**:
   - `storeState(module, key, value)` - Store single key-value
   - `storeState(module, map)` - Store multiple values
   - `storeTypedState(module, object)` - Store typed object

3. **Automatic Registration**:
   - The `@Service` annotation registers your solver automatically
   - Spring's dependency injection finds all `ModuleSolver` implementations

## Frontend Implementation

### Step 1: Add Module Type to Frontend Enum

Add your module to the frontend types:

```typescript
// ktanesolver-frontend/src/types/index.ts
export enum ModuleType {
  // ... existing types
  YOUR_NEW_MODULE = "YOUR_NEW_MODULE",
}
```

### Step 2: Create Service File

Create a service for API communication:

```typescript
// ktanesolver-frontend/src/services/yourModuleService.ts
import { api, withErrorWrapping } from "../lib/api";

export interface YourModuleSolveRequest {
  input: {
    field1: string;
    field2: number;
    field3: boolean;
  };
}

export interface YourModuleSolveResponse {
  output: {
    solution: string;
    score: number;
  };
}

export const solveYourModule = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: YourModuleSolveRequest["input"]
): Promise<YourModuleSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<YourModuleSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      { input }
    );
    return response.data;
  });
};
```

### Step 3: Create React Component

Create the solver component:

```tsx
// ktanesolver-frontend/src/components/solvers/YourModuleSolver.tsx
import { useState } from "react";
import type { BombEntity } from "../types";
import { ModuleType } from "../types";
import { useRoundStore } from "../store/useRoundStore";
import { generateTwitchCommand } from "../utils/twitchCommands";
import { solveYourModule, type YourModuleSolveRequest, type YourModuleSolveResponse } from "../services/yourModuleService";
import ModuleNumberInput from "../ModuleNumberInput";

interface YourModuleSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function YourModuleSolver({ bomb }: YourModuleSolverProps) {
  const [field1, setField1] = useState<string>("");
  const [field2, setField2] = useState<number>(0);
  const [field3, setField3] = useState<boolean>(false);
  const [result, setResult] = useState<YourModuleSolveResponse["output"] | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const input: YourModuleSolveRequest["input"] = {
        field1: field1.trim(),
        field2: field2,
        field3: field3
      };

      const response = await solveYourModule(
        round.id,
        bomb.id,
        currentModule.id,
        input
      );

      setResult(response.output);
      
      if (response.output) {
        const command = generateTwitchCommand(
          moduleNumber,
          ModuleType.YOUR_NEW_MODULE,
          response.output.solution
        );
        setTwitchCommand(command);
      }

      // Check if module is fully solved
      if (currentModule.type === ModuleType.YOUR_NEW_MODULE) {
        markModuleSolved(currentModule.id);
        setIsSolved(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve module");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setField1("");
    setField2(0);
    setField3(false);
    setResult(null);
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Module Solver</h3>
      
      <ModuleNumberInput />
      
      {/* Input fields */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Field 1</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={field1}
          onChange={(e) => setField1(e.target.value)}
          placeholder="Enter value"
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Field 2</span>
        </label>
        <input
          type="number"
          className="input input-bordered"
          value={field2}
          onChange={(e) => setField2(parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Field 3</span>
        </label>
        <input
          type="checkbox"
          className="checkbox"
          checked={field3}
          onChange={(e) => setField3(e.target.checked)}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          className="btn btn-primary"
          onClick={handleSolve}
          disabled={isLoading || isSolved}
        >
          {isLoading ? "Solving..." : "Solve"}
        </button>
        
        <button
          className="btn btn-secondary"
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Result display */}
      {result && (
        <div className="space-y-2">
          <div className="alert alert-success">
            <div>
              <strong>Solution:</strong> {result.solution}
            </div>
            <div>
              <strong>Score:</strong> {result.score}
            </div>
          </div>
          
          {twitchCommand && (
            <div className="alert alert-info">
              <strong>Twitch Command:</strong> {twitchCommand}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 4: Register Component in Module Selector

The module will automatically appear in the module selector once the backend is running, as it fetches the module catalog from the API.

## Testing Your Module

1. **Backend Testing**:
   - Run the application and check `/api/modules` endpoint
   - Your module should appear in the catalog
   - Test the solve endpoint with proper input

2. **Frontend Testing**:
   - Navigate to the app
   - Select your module from the module selector
   - Test input validation and solving

## Best Practices

1. **Input Validation**:
   - Always validate inputs in the solver
   - Return meaningful error messages using `failure()`

2. **State Management**:
   - Use `storeState()` for multi-step modules
   - Clear state when appropriate

3. **Error Handling**:
   - Frontend should handle API errors gracefully
   - Display user-friendly error messages

4. **Code Organization**:
   - Keep related classes in the same package
   - Follow naming conventions (`YourModuleSolver`, `YourModuleInput`, etc.)

5. **Documentation**:
   - Add clear descriptions in `@ModuleInfo`
   - Include relevant tags for discoverability

## Example: Complete Simple Module

For a complete example, refer to existing modules like:
- `AnagramsSolver` - Simple text input module
- `ColorFlashSolver` - Complex state management
- `ButtonSolver` - Multiple input types

## Troubleshooting

1. **Module not appearing**:
   - Check if `@Service` annotation is present
   - Verify `@ModuleInfo` has correct type
   - Check console for Spring registration errors

2. **Frontend not connecting**:
   - Verify backend is running
   - Check API endpoint matches service call
   - Ensure TypeScript types match backend classes

3. **Solve not working**:
   - Check input validation
   - Verify return type matches expected output
   - Check browser console for errors
