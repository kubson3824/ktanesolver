package ktanesolver.module.modded.regular.partytime;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.partytime.PartyTimeInput.SpaceType;

@Service
@ModuleInfo(
	type = ModuleType.PARTY_TIME,
	id = "PartyTime",
	name = "Party Time",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Classify every water and fire stop on the serpentine party board.",
	tags = {"board", "dice", "water", "fire", "automation"}
)
public class PartyTimeSolver extends AbstractModuleSolver<PartyTimeInput, PartyTimeOutput> {
	@Override
	protected SolveResult<PartyTimeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, PartyTimeInput input) {
		if (input == null || input.spaces() == null || input.spaces().size() != 20 || input.spaces().stream().anyMatch(java.util.Objects::isNull))
			return failure("Enter all 20 board spaces");
		if (input.spaces().getFirst() != SpaceType.START || input.spaces().getLast() != SpaceType.GOAL)
			return failure("Space 0 must be Start and space 19 must be Goal");
		if (input.spaces().subList(1,19).stream().anyMatch(space -> space == SpaceType.START || space == SpaceType.GOAL))
			return failure("Start and Goal cannot appear inside the board");

		long waterCount = count(input.spaces(), SpaceType.WATER);
		long fireCount = count(input.spaces(), SpaceType.FIRE);
		List<Integer> die = new ArrayList<>(), press = new ArrayList<>();
		for (int index=1;index<19;index++) {
			SpaceType space=input.spaces().get(index);
			if (space != SpaceType.WATER && space != SpaceType.FIRE) continue;
			Set<Integer> neighbors=neighbors(index);
			boolean pressSpace;
			if (space == SpaceType.WATER) {
				boolean batteryAdjacent=neighbors.stream().map(input.spaces()::get).anyMatch(type -> type==SpaceType.D_BATTERY||type==SpaceType.AA_BATTERY);
				pressSpace=!(fireCount==4&&waterCount<3)&&!batteryAdjacent;
			} else {
				boolean waterAdjacent=neighbors.stream().map(input.spaces()::get).anyMatch(type -> type==SpaceType.WATER);
				pressSpace=(waterCount==4&&fireCount<3)||waterAdjacent;
			}
			(pressSpace?press:die).add(index);
		}
		List<String> actions=new ArrayList<>();
		if(!die.isEmpty())actions.add("die "+join(die));
		if(!press.isEmpty())actions.add("space "+join(press));
		actions.add("roll start");
		return success(new PartyTimeOutput(List.copyOf(die),List.copyOf(press),List.copyOf(actions)));
	}

	private static Set<Integer> neighbors(int index) {
		Set<Integer> result=new HashSet<>();
		result.add(index-1);result.add(index+1);
		int offset=2*(index%5)+1;
		result.add(Math.max(0,index-offset));
		result.add(Math.min(19,index+10-offset));
		return result;
	}
	private static long count(List<SpaceType> spaces, SpaceType type) { return spaces.stream().filter(type::equals).count(); }
	private static String join(List<Integer> values) { return String.join(" ",values.stream().map(String::valueOf).toList()); }
}
