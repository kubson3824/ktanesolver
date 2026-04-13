package ktanesolver.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.event.RoundStateChangedEvent;
import ktanesolver.enums.ModuleType;
import ktanesolver.utils.Json;
import ktanesolver.registry.ModuleSolverRegistry;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.ModuleRepository;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;
import ktanesolver.logic.ModuleSolver;

@ExtendWith(MockitoExtension.class)
class ModuleServiceTest {

    @Mock
    private BombRepository bombRepo;

    @Mock
    private ModuleRepository moduleRepo;

    @Mock
    private ModuleSolverRegistry registry;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private ModuleSolver<TestInput, TestOutput> solver;

    private ModuleService moduleService;

    @BeforeEach
    void setUp() {
        new Json(new ObjectMapper());
        moduleService = new ModuleService(bombRepo, moduleRepo, registry, eventPublisher);
    }

    @Test
    void solveModuleReturnsNotImplementedWhenModuleTypeHasNoRegisteredSolver() {
        ModuleEntity module = createModule(ModuleType.VENTING_GAS);
        when(moduleRepo.findByIdWithBombAndRound(module.getId())).thenReturn(Optional.of(module));
        when(registry.<ModuleInput, ModuleOutput>get(ModuleType.VENTING_GAS)).thenReturn(null);

        assertThatThrownBy(() -> moduleService.solveModule(
                module.getBomb().getRound().getId(),
                module.getBomb().getId(),
                module.getId(),
                Map.of()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(error -> {
                    ResponseStatusException response = (ResponseStatusException) error;
                    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_IMPLEMENTED);
                    assertThat(response.getReason()).isEqualTo("No solver is registered for module type VENTING_GAS");
                });

        verify(moduleRepo, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void solveModuleReturnsBadRequestWhenInputCannotBeConverted() {
        ModuleEntity module = createModule(ModuleType.BUTTON);
        when(moduleRepo.findByIdWithBombAndRound(module.getId())).thenReturn(Optional.of(module));
        when(registry.<TestInput, TestOutput>get(ModuleType.BUTTON)).thenReturn(solver);
        when(solver.inputType()).thenReturn(TestInput.class);

        assertThatThrownBy(() -> moduleService.solveModule(
                module.getBomb().getRound().getId(),
                module.getBomb().getId(),
                module.getId(),
                Map.of("selection", "NOT_A_REAL_MODULE")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(error -> {
                    ResponseStatusException response = (ResponseStatusException) error;
                    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(response.getReason()).isEqualTo("Invalid solve input for module type BUTTON");
                });

        verify(moduleRepo, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void removeModuleDeletesModuleAndPublishesRoundUpdate() {
        ModuleEntity module = createModule(ModuleType.BUTTON);
        module.getBomb().setModules(new ArrayList<>());
        module.getBomb().getModules().add(module);
        when(moduleRepo.findByIdWithBomb(module.getId())).thenReturn(Optional.of(module));
        doAnswer(invocation -> {
            ModuleEntity deletedModule = invocation.getArgument(0);
            deletedModule.getBomb().getModules().remove(deletedModule);
            return null;
        }).when(moduleRepo).delete(module);

        moduleService.removeModule(module.getBomb().getId(), module.getId());

        assertThat(module.getBomb().getModules()).isEmpty();
        verify(moduleRepo).delete(module);
        verify(eventPublisher).publishEvent(any(RoundStateChangedEvent.class));
    }

    @Test
    void removeModuleReturnsNotFoundWhenModuleDoesNotBelongToBomb() {
        ModuleEntity module = createModule(ModuleType.BUTTON);
        when(moduleRepo.findByIdWithBomb(module.getId())).thenReturn(Optional.of(module));

        assertThatThrownBy(() -> moduleService.removeModule(UUID.randomUUID(), module.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(error -> {
                    ResponseStatusException response = (ResponseStatusException) error;
                    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(response.getReason()).isEqualTo("Module not found");
                });

        verify(moduleRepo, never()).delete(any(ModuleEntity.class));
        verify(eventPublisher, never()).publishEvent(any());
    }

    private static ModuleEntity createModule(ModuleType moduleType) {
        RoundEntity round = new RoundEntity();
        round.setId(UUID.randomUUID());

        BombEntity bomb = new BombEntity();
        bomb.setId(UUID.randomUUID());
        bomb.setRound(round);

        ModuleEntity module = new ModuleEntity();
        module.setId(UUID.randomUUID());
        module.setBomb(bomb);
        module.setType(moduleType);

        return module;
    }

    private record TestInput(ModuleType selection) implements ModuleInput {
    }

    private record TestOutput(String value) implements ModuleOutput {
    }
}
