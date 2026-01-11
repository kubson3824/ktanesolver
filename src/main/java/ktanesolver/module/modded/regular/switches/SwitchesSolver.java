package ktanesolver.module.modded.regular.switches;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo(
        type = ModuleType.SWITCHES,
        id = "switches",
        name = "Switches",
        category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
        description = "Set switches to the correct positions",
        tags = {"logic", "puzzle"}
)
public class SwitchesSolver extends AbstractModuleSolver<SwitchesInput, SwitchesOutput> {

    // Default forbidden states from the manual (in binary: 0-31 range)
    private static final int[] DEFAULT_FORBIDDEN_STATES = {4, 26, 30, 9, 25, 29, 3, 11, 7, 15};

    @Override
    public SolveResult<SwitchesOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SwitchesInput input) {
        boolean[] currentSwitches = input.currentSwitches();
        boolean[] ledPositions = input.ledPositions();
        
        // Validate input
        if (currentSwitches.length != 5 || ledPositions.length != 5) {
            SwitchesOutput output = new SwitchesOutput(false, "Invalid input: must have 5 switches and 5 LED positions", new ArrayList<>());
            return success(output, false);
        }
        
        // Store module state
        module.getState().put("currentSwitches", currentSwitches);
        module.getState().put("ledPositions", ledPositions);
        
        // Calculate target configuration (switches should point to lit LEDs)
        boolean[] targetSwitches = new boolean[5];
        // If LED is at top (true), switch should be up (true)
        // If LED is at bottom (false), switch should be down (false)
        System.arraycopy(ledPositions, 0, targetSwitches, 0, 5);
        
        // Check if already solved
        if (isMatch(currentSwitches, targetSwitches)) {
            SwitchesOutput output = new SwitchesOutput(true, "Module solved! All switches are in correct positions.", new ArrayList<>());
            return success(output);
        }
        
        // Check if current state is forbidden
        if (isForbidden(currentSwitches)) {
            SwitchesOutput output = new SwitchesOutput(false, "Current switch configuration is invalid! Please reset the module.", new ArrayList<>());
            return success(output, false);
        }
        
        // Find solution path using BFS
        List<Integer> solutionPath = findSolutionPath(currentSwitches, targetSwitches);
        
        if (solutionPath.isEmpty()) {
            SwitchesOutput output = new SwitchesOutput(false, "No solution found. This should not happen with valid inputs.", new ArrayList<>());
            return success(output, false);
        }
        
        // Generate instruction
        StringBuilder instruction = new StringBuilder("Flip switches in this order: ");
        for (int i = 0; i < solutionPath.size(); i++) {
            if (i > 0) instruction.append(" → ");
            instruction.append("Switch ").append(solutionPath.get(i));
        }
        
        SwitchesOutput output = new SwitchesOutput(true, instruction.toString(), solutionPath);
        return success(output);
    }
    
    private boolean isMatch(boolean[] switches, boolean[] target) {
        for (int i = 0; i < switches.length; i++) {
            if (switches[i] != target[i]) {
                return false;
            }
        }
        return true;
    }
    
    private boolean isForbidden(boolean[] switches) {
        int state = 0;
        for (int i = 0; i < 5; i++) {
            if (switches[i]) {
                state |= (1 << i);
            }
        }
        
        for (int forbidden : DEFAULT_FORBIDDEN_STATES) {
            if (state == forbidden) {
                return true;
            }
        }
        return false;
    }
    
    private List<Integer> findSolutionPath(boolean[] start, boolean[] target) {
        // BFS to find shortest path from start to target avoiding forbidden states
        Queue<StateNode> queue = new LinkedList<>();
        Map<Integer, Integer> visited = new HashMap<>(); // state -> parent state
        Map<Integer, Integer> switchFlipped = new HashMap<>(); // state -> switch flipped to reach this state
        
        int startState = booleanArrayToInt(start);
        int targetState = booleanArrayToInt(target);
        
        if (startState == targetState) {
            return new ArrayList<>();
        }
        
        queue.add(new StateNode(startState));
        visited.put(startState, -1);
        
        while (!queue.isEmpty()) {
            StateNode current = queue.poll();
            int currentState = current.state;
            
            // Check all possible moves (flip each switch)
            for (int i = 0; i < 5; i++) {
                int nextState = currentState ^ (1 << i); // Flip switch i
                
                // Skip if already visited or forbidden
                if (visited.containsKey(nextState) || isForbidden(nextState)) {
                    continue;
                }
                
                // Record path
                visited.put(nextState, currentState);
                switchFlipped.put(nextState, i);
                
                // Check if we reached target
                if (nextState == targetState) {
                    return reconstructPath(visited, switchFlipped, targetState);
                }
                
                queue.add(new StateNode(nextState));
            }
        }
        
        return new ArrayList<>(); // No solution found
    }
    
    private List<Integer> reconstructPath(Map<Integer, Integer> visited, Map<Integer, Integer> switchFlipped, int targetState) {
        List<Integer> path = new ArrayList<>();
        int current = targetState;
        
        while (visited.get(current) != -1) {
            int switchFlippedToReachCurrent = switchFlipped.get(current);
            path.addFirst(switchFlippedToReachCurrent + 1); // Convert to 1-based indexing
            current = visited.get(current);
        }
        
        return path;
    }
    
    private int booleanArrayToInt(boolean[] array) {
        int result = 0;
        for (int i = 0; i < array.length; i++) {
            if (array[i]) {
                result |= (1 << i);
            }
        }
        return result;
    }
    
    private boolean isForbidden(int state) {
        for (int forbidden : DEFAULT_FORBIDDEN_STATES) {
            if (state == forbidden) {
                return true;
            }
        }
        return false;
    }
    
    private static class StateNode {
        final int state;
        
        StateNode(int state) {
            this.state = state;
        }
    }
}
