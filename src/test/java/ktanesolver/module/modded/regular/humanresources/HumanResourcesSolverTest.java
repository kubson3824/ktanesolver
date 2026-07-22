package ktanesolver.module.modded.regular.humanresources;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.humanresources.HumanResourcesInput.Descriptor;
import ktanesolver.module.modded.regular.humanresources.HumanResourcesInput.Person;

class HumanResourcesSolverTest {
	@Test
	void breaksRequiredTraitTiesWithPreferredTraitsAndRecordsSouvenirSets() {
		HumanResourcesSolver solver = new HumanResourcesSolver();
		ModuleEntity module = new ModuleEntity();
		HumanResourcesInput input = new HumanResourcesInput(
			List.of(Person.REBECCA, Person.DAMIAN, Person.ASHLEY, Person.SAMUEL, Person.QUINN),
			List.of(Person.SILAS, Person.NOAH, Person.TIM, Person.DYLAN, Person.MIKE),
			List.of(Descriptor.INTELLECTUAL, Descriptor.DEVISER, Descriptor.DIRECTOR),
			List.of(Descriptor.MANAGER, Descriptor.SHOWMAN)
		);

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, input))
			.isEqualTo(new SolveSuccess<>(new HumanResourcesOutput(Person.REBECCA, Person.SILAS), true));
		assertThat(module.getState()).containsEntry("employees", input.employees())
			.containsEntry("applicants", input.applicants())
			.containsEntry("redDescriptors", input.redDescriptors())
			.containsEntry("greenDescriptors", input.greenDescriptors());
	}
}
