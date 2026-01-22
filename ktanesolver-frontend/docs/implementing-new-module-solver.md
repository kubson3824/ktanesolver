# How to Implement a New Module Solver

This guide will walk you through implementing a new module solver for the ktanesolver frontend application.

## Overview

The ktanesolver frontend follows a structured pattern for implementing module solvers. Each solver consists of:
- A React component in `src/components/solvers/`
- A service layer for API calls in `src/services/`
- Integration in the main SolvePage component
- Type definitions for the module

## Step 1: Add Module Type

First, add your module type to the enum in `src/types/index.ts`:

```typescript
export enum ModuleType {
  // ... existing modules
  YOUR_MODULE = "YOUR_MODULE",
}
```

## Step 2: Create the Service Layer

Create a new service file in `src/services/` named after your module (e.g., `yourModuleService.ts`):

```typescript
import { api, withErrorWrapping } from "../lib/api";

export interface YourModuleSolveRequest {
  input: {
    // Define your input fields here
    field1: string;
    field2: number;
    // ...
  }
}

export interface YourModuleSolveResponse {
  output: {
    // Define your response fields here
    instruction: string;
    // ...
  };
}

export const solveYourModule = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: YourModuleSolveRequest
): Promise<YourModuleSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<YourModuleSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
```

## Step 3: Create the Solver Component

Create a new React component in `src/components/solvers/` (e.g., `YourModuleSolver.tsx`):

### Basic Structure

```typescript
import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveYourModule as solveYourModuleApi } from "../../services/yourModuleService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  BombInfoDisplay,
  SolverControls
} from "../common";

interface YourModuleSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function YourModuleSolver({ bomb }: YourModuleSolverProps) {
  // State management
  const [inputField1, setInputField1] = useState<string>("");
  const [inputField2, setInputField2] = useState<number>(0);
  const [result, setResult] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  // Use the common solver hook for shared state
  const {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
    moduleNumber
  } = useSolver();

  // Restore state from module when component loads
  useEffect(() => {
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as { field1?: string; field2?: number };
      
      if (moduleState.field1) setInputField1(moduleState.field1);
      if (moduleState.field2) setInputField2(moduleState.field2);
    }

    // Restore solution if module was solved
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as { instruction?: string };
      
      if (solution.instruction) {
        setResult(solution.instruction);
        setIsSolved(true);

        // Generate twitch command from the solution
        const command = generateTwitchCommand({
          moduleType: ModuleType.YOUR_MODULE,
          result: solution,
          moduleNumber
        });
        setTwitchCommand(command);
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

  // Solve function
  const solveModule = async () => {
    // Validation
    if (!inputField1 || !inputField2) {
      setError("Please fill all required fields");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveYourModuleApi(round.id, bomb.id, currentModule.id, {
        input: {
          field1: inputField1,
          field2: inputField2
        }
      });

      setResult(response.output.instruction);
      setIsSolved(true);

      // Generate Twitch command
      const command = generateTwitchCommand({
        moduleType: ModuleType.YOUR_MODULE,
        result: response.output,
        moduleNumber
      });
      setTwitchCommand(command);

      // Mark module as solved
      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve module");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset function
  const reset = () => {
    setInputField1("");
    setInputField2(0);
    setResult("");
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      {/* Your module visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        {/* Add your module's UI here */}
      </div>

      {/* Bomb info display */}
      <BombInfoDisplay bomb={bomb} />

      {/* Controls */}
      <SolverControls
        onSolve={solveModule}
        onReset={reset}
        isSolveDisabled={!inputField1 || !inputField2}
        isLoading={isLoading}
        solveText="Solve Module"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Result display */}
      {result && (
        <div className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-bold">{result}</span>
        </div>
      )}

      {/* Twitch command display */}
      <TwitchCommandDisplay command={twitchCommand} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p>Add your module instructions here.</p>
      </div>
    </SolverLayout>
  );
}
```

## Step 4: Register the Solver

Import your new solver in `src/pages/SolvePage.tsx`:

```typescript
import YourModuleSolver from "../components/solvers/YourModuleSolver";
```

Add it to the conditional rendering in the solver UI section:

```typescript
) : currentModule.moduleType === "YOUR_MODULE" ? (
  <YourModuleSolver bomb={currentBomb} />
) : currentModule.moduleType === "NEXT_MODULE" ? (
```

## Step 5: Common Patterns and Best Practices

### Using the useSolver Hook

The `useSolver` hook provides common state management:

```typescript
const {
  isLoading,      // Loading state for API calls
  error,          // Error message
  isSolved,       // Whether module is solved
  setIsLoading,   // Set loading state
  setError,       // Set error message
  setIsSolved,    // Set solved state
  clearError,     // Clear error message
  reset,          // Reset all solver state
  currentModule,  // Current module entity
  round,          // Current round entity
  markModuleSolved, // Function to mark module as solved
  moduleNumber    // Current module number
} = useSolver();
```

### State Persistence

Save user input to module state so it persists when switching between modules:

```typescript
// Save state when input changes
if (currentModule && inputChanged) {
  const moduleState = {
    field1: inputField1,
    field2: inputField2
  };

  // Update the module in the store
  useRoundStore.getState().round?.bombs.forEach(bomb => {
    if (bomb.id === currentModule.bomb.id) {
      const module = bomb.modules.find(m => m.id === currentModule.id);
      if (module) {
        module.state = moduleState;
      }
    }
  });
}
```

### UI Components

Use the common components for consistent UI:

- `SolverLayout`: Wrapper with module number input
- `BombInfoDisplay`: Shows bomb serial, batteries, indicators
- `SolverControls`: Standard solve/reset buttons
- `ErrorAlert`: Error message display
- `TwitchCommandDisplay`: Shows generated Twitch command

### Number Inputs

For numeric inputs in your solver, use standard HTML number inputs with proper styling:

```typescript
<input
  type="number"
  min="1"
  max="99"
  value={numericValue}
  onChange={(e) => setNumericValue(parseInt(e.target.value) || 0)}
  className="input input-bordered w-full"
  placeholder="Enter number"
  disabled={isSolved}
/>
```

The `ModuleNumberInput` component is automatically included when using `SolverLayout`. It allows users to set a module number (1-99) that's used as a prefix for Twitch chat commands (e.g., `!5 solve` for module 5).

### Styling Guidelines

- Use Tailwind CSS classes
- Follow the existing color scheme:
  - Module visualization: `bg-gray-800`
  - Success alerts: `alert-success`
  - Error alerts: `alert-error`
  - Warning alerts: `alert-warning`
  - Primary buttons: `btn btn-primary`
  - Outline buttons: `btn btn-outline`

### Twitch Commands

Generate Twitch commands using the utility:

```typescript
const command = generateTwitchCommand({
  moduleType: ModuleType.YOUR_MODULE,
  result: response.output, // or your result object
  moduleNumber
});
```

## Step 6: Testing Your Solver

1. Start the development server
2. Create a new round with your module
3. Navigate to the solve page
4. Test all input scenarios
5. Verify error handling
6. Check that state persists when switching modules
7. Confirm Twitch commands generate correctly

## Example: Solver with Text and Number Inputs

Here's a complete example for a solver that accepts both text and numeric inputs:

```typescript
import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveComplexModule as solveComplexModuleApi } from "../../services/complexModuleService";
import { 
  useSolver,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  BombInfoDisplay,
  SolverControls
} from "../common";

export default function ComplexModuleSolver({ bomb }: BombEntity | null | undefined) {
  const [text, setText] = useState("");
  const [count, setCount] = useState(1);
  const [result, setResult] = useState("");
  const [twitchCommand, setTwitchCommand] = useState("");

  const {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
    moduleNumber
  } = useSolver();

  useEffect(() => {
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as { text?: string; count?: number };
      
      if (moduleState.text) setText(moduleState.text);
      if (moduleState.count) setCount(moduleState.count);
    }

    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as { instruction?: string };
      
      if (solution.instruction) {
        setResult(solution.instruction);
        setIsSolved(true);

        const command = generateTwitchCommand({
          moduleType: ModuleType.COMPLEX_MODULE,
          result: solution,
          moduleNumber
        });
        setTwitchCommand(command);
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

  const solve = async () => {
    if (!text.trim()) {
      setError("Please enter text");
      return;
    }

    if (count < 1 || count > 10) {
      setError("Count must be between 1 and 10");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveComplexModuleApi(round.id, bomb.id, currentModule.id, {
        input: {
          text: text,
          count: count
        }
      });

      setResult(response.output.instruction);
      setIsSolved(true);

      const command = generateTwitchCommand({
        moduleType: ModuleType.COMPLEX_MODULE,
        result: response.output,
        moduleNumber
      });
      setTwitchCommand(command);

      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve module");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setText("");
    setCount(1);
    setResult("");
    setTwitchCommand("");
    resetSolverState();
  };

  // Save state when inputs change
  const handleTextChange = (value: string) => {
    setText(value);
    if (currentModule) {
      const moduleState = { text: value, count };
      // Update module state in store...
    }
  };

  const handleCountChange = (value: number) => {
    setCount(value);
    if (currentModule) {
      const moduleState = { text, count: value };
      // Update module state in store...
    }
  };

  return (
    <SolverLayout>
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Text Input
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Enter text"
              disabled={isSolved}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Count (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={count}
              onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)}
              className="input input-bordered w-full"
              disabled={isSolved}
            />
          </div>
        </div>
      </div>

      <BombInfoDisplay bomb={bomb} />

      <SolverControls
        onSolve={solve}
        onReset={reset}
        isSolveDisabled={!text.trim() || isLoading}
        isLoading={isLoading}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <div className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{result}</span>
        </div>
      )}

      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
```

## Additional Tips

1. **Keep components focused** - Each solver should only handle its specific module
2. **Reuse common components** - Don't recreate buttons, alerts, etc.
3. **Handle all edge cases** - Empty inputs, network errors, missing data
4. **Follow naming conventions** - Use PascalCase for components, camelCase for functions
5. **Add TypeScript types** - Define interfaces for all API requests/responses
6. **Test thoroughly** - Try to break your solver with unexpected inputs

## Troubleshooting

- Module not showing up? Check if it's added to `ModuleType` enum and imported in `SolvePage`
- API calls failing? Verify the service layer and backend endpoint
- State not persisting? Ensure you're updating the module state in the store
- UI not updating? Check if you're using the proper React state patterns

That's it! You now have everything you need to implement a new module solver.
