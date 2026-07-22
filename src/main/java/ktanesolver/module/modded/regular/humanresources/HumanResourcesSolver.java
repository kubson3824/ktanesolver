package ktanesolver.module.modded.regular.humanresources;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.humanresources.HumanResourcesInput.Descriptor;
import ktanesolver.module.modded.regular.humanresources.HumanResourcesInput.Person;

@Service
@ModuleInfo(
	type = ModuleType.HUMAN_RESOURCES,
	id = "HumanResourcesModule",
	name = "Human Resources",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Rank employees and applicants by required and preferred MBTI traits.",
	tags = {"names", "personality", "MBTI", "Souvenir"}
)
public class HumanResourcesSolver extends AbstractModuleSolver<HumanResourcesInput, HumanResourcesOutput> {
	@Override
	protected SolveResult<HumanResourcesOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, HumanResourcesInput input
	) {
		if(input == null || !valid(input.employees(), 5) || !valid(input.applicants(), 5)
			|| !valid(input.redDescriptors(), 3) || !valid(input.greenDescriptors(), 2)
			|| !disjoint(input.employees(), input.applicants())
			|| !disjoint(input.redDescriptors(), input.greenDescriptors())) {
			return failure("Select 5 different employees, 5 different applicants, 3 red descriptors, and 2 green descriptors");
		}

		Person fire = findPerson(input.employees(), input.redDescriptors());
		if(fire == null || input.greenDescriptors().contains(fire.descriptor)) {
			return failure("The displayed values do not identify one employee to fire");
		}
		Person hire = findPerson(input.applicants(), List.of(
			input.greenDescriptors().get(0), input.greenDescriptors().get(1), fire.descriptor));
		if(hire == null) return failure("The displayed values do not identify one applicant to hire");

		storeState(module, Map.of(
			"employees", input.employees(), "applicants", input.applicants(),
			"redDescriptors", input.redDescriptors(), "greenDescriptors", input.greenDescriptors()
		));
		return success(new HumanResourcesOutput(fire, hire));
	}

	private static Person findPerson(List<Person> people, List<Descriptor> descriptors) {
		List<Character> required = new java.util.ArrayList<>();
		List<Character> preferred = new java.util.ArrayList<>();
		for(int position = 0; position < 4; position++) {
			char first = descriptors.get(0).mbti.charAt(position);
			char second = descriptors.get(1).mbti.charAt(position);
			char third = descriptors.get(2).mbti.charAt(position);
			if(first == second && first == third) required.add(first);
			else preferred.add(first == second || first == third ? first : second);
		}

		List<RankedPerson> ranked = people.stream()
			.map(person -> new RankedPerson(person, score(person, required), score(person, preferred)))
			.sorted(Comparator.comparingInt(RankedPerson::required).thenComparingInt(RankedPerson::preferred).reversed())
			.toList();
		return ranked.get(0).required == ranked.get(1).required && ranked.get(0).preferred == ranked.get(1).preferred
			? null : ranked.get(0).person;
	}

	private static int score(Person person, List<Character> traits) {
		return (int) traits.stream().filter(trait -> person.descriptor.mbti.indexOf(trait) >= 0).count();
	}

	private static boolean valid(List<?> values, int size) {
		return values != null && values.size() == size && values.stream().noneMatch(java.util.Objects::isNull)
			&& new HashSet<>(values).size() == size;
	}

	private static boolean disjoint(List<?> first, List<?> second) {
		return first.stream().noneMatch(second::contains);
	}

	private record RankedPerson(Person person, int required, int preferred) {}
}
