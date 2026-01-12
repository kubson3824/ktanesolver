package ktanesolver.service;

import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.registry.ModuleSolverRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ModuleCatalogServiceTest {

    @Mock
    private ModuleSolverRegistry solverRegistry;
    
    @Mock
    private ModuleSolver<?, ?> mockSolver1;
    
    @Mock
    private ModuleSolver<?, ?> mockSolver2;
    
    private ModuleCatalogService service;
    
    @BeforeEach
    void setUp() {
        service = new ModuleCatalogService(solverRegistry);
    }
    
    @Test
    void getAllModules_ShouldReturnModulesFromSolvers() {
        // Arrange
        ModuleCatalogDto catalog1 = new ModuleCatalogDto("test1", "Test Module 1", 
            ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR, "TEST_1", 
            List.of("test"), "Test description", true, true);
            
        ModuleCatalogDto catalog2 = new ModuleCatalogDto("test2", "Test Module 2", 
            ModuleCatalogDto.ModuleCategory.VANILLA_NEEDY, "TEST_2", 
            List.of("test", "needy"), "Test needy module", true, true);
        
        when(mockSolver1.getCatalogInfo()).thenReturn(catalog1);
        when(mockSolver2.getCatalogInfo()).thenReturn(catalog2);
        when(solverRegistry.getAllSolvers()).thenReturn(List.of(mockSolver1, mockSolver2));
        
        // Act
        List<ModuleCatalogDto> result = service.getAllModules(null, null);
        
        // Assert
        assertEquals(7, result.size()); // 2 from solvers + 5 planned modules
        assertTrue(result.contains(catalog1));
        assertTrue(result.contains(catalog2));
        
        // Verify planned modules are included
        assertTrue(result.stream().anyMatch(m -> m.id().equals("bigButton")));
        assertTrue(result.stream().anyMatch(m -> m.id().equals("alphabets")));
        assertTrue(result.stream().anyMatch(m -> m.id().equals("tChess")));
        assertTrue(result.stream().anyMatch(m -> m.id().equals("needyKnobs")));
        assertTrue(result.stream().anyMatch(m -> m.id().equals("safetySafe")));
    }
    
    @Test
    void getAllModules_WithCategoryFilter_ShouldReturnFilteredModules() {
        // Arrange
        ModuleCatalogDto catalog = new ModuleCatalogDto("test1", "Test Module 1", 
            ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR, "TEST_1", 
            List.of("test"), "Test description", true, true);
        
        when(mockSolver1.getCatalogInfo()).thenReturn(catalog);
        when(solverRegistry.getAllSolvers()).thenReturn(List.of(mockSolver1));
        
        // Act
        List<ModuleCatalogDto> result = service.getAllModules("VANILLA_REGULAR", null);
        
        // Assert
        assertEquals(1, result.size()); // Only 1 from solver matches VANILLA_REGULAR, planned modules are MODDED_*
        assertTrue(result.stream().allMatch(m -> m.category() == ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR));
    }
    
    @Test
    void getAllModules_WithSearchTerm_ShouldReturnMatchingModules() {
        // Arrange
        ModuleCatalogDto catalog1 = new ModuleCatalogDto("test1", "Test Module 1", 
            ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR, "TEST_1", 
            List.of("searchable"), "Test description", true, true);
            
        ModuleCatalogDto catalog2 = new ModuleCatalogDto("test2", "Another Module", 
            ModuleCatalogDto.ModuleCategory.VANILLA_NEEDY, "TEST_2", 
            List.of("other"), "Different description", true, true);
        
        when(mockSolver1.getCatalogInfo()).thenReturn(catalog1);
        when(mockSolver2.getCatalogInfo()).thenReturn(catalog2);
        when(solverRegistry.getAllSolvers()).thenReturn(List.of(mockSolver1, mockSolver2));
        
        // Act
        List<ModuleCatalogDto> result = service.getAllModules(null, "Test");
        
        // Assert
        assertEquals(1, result.size());
        assertEquals("test1", result.get(0).id());
    }
}
