package ktanesolver.module.modded.regular.subways;

import java.util.List;

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
@ModuleInfo(type = ModuleType.SUBWAYS, id = "subways", name = "Subways", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Find a commuter's route, stops, and departure time.", tags = {"routing", "table", "transit"})
public class SubwaysSolver extends AbstractModuleSolver<SubwaysInput, SubwaysOutput> {
	private static final String BATTERY = "BATTERY";
	private static final String[][][] SCHEDULES = {
		{
			{"1|8 AM", "8|7 PM", "4|4 AM", "3|11 AM", "6|12 PM"},
			{"6|7 AM", "1|2 AM", "2|1 PM", "7|" + BATTERY, "3|4 PM"},
			{"7|" + BATTERY, "2|3 AM", "5|6 PM", "8|9 AM", "4|" + BATTERY},
			{"8|8 PM", "2|1 AM", "1|2 PM", "3|" + BATTERY, "5|11 PM"},
			{"7|6 AM", "1|" + BATTERY, "4|3 PM", "6|5 AM", "2|5 PM"},
			{"5|12 AM", "7|10 PM", "3|" + BATTERY, "8|10 AM", "4|9 PM"}
		},
		{
			{"9|1 AM", "14|" + BATTERY, "13|5 PM", "10|5 AM", "15|6 PM"},
			{"13|" + BATTERY, "11|12 PM", "10|2 AM", "16|4 AM", "14|9 AM"},
			{"9|8 AM", "16|7 PM", "12|" + BATTERY, "11|9 PM", "15|11 PM"},
			{"13|11 AM", "9|4 PM", "10|3 AM", "16|1 PM", "12|" + BATTERY},
			{"13|7 AM", "16|2 PM", "11|12 AM", "9|" + BATTERY, "12|10 AM"},
			{"12|" + BATTERY, "14|8 PM", "9|6 AM", "13|3 AM", "16|10 PM"}
		},
		{
			{"17|" + BATTERY, "18|9 AM", "21|8 PM", "22|2 PM", "19|7 AM"},
			{"20|3 AM", "19|10 PM", "23|" + BATTERY, "18|10 AM", "22|12 AM"},
			{"20|5 PM", "21|" + BATTERY, "23|11 AM", "18|8 AM", "24|4 AM"},
			{"17|12 PM", "22|1 PM", "24|9 PM", "18|6 PM", "20|" + BATTERY},
			{"19|5 AM", "21|3 PM", "23|6 AM", "24|" + BATTERY, "17|11 PM"},
			{"19|2 AM", "17|" + BATTERY, "20|7 PM", "21|1 AM", "23|4 PM"}
		}
	};

	private static final String[][] ROUTES = {
		{"Canal St 1", "Franklin St 1", "Chambers St 1-2-3"},
		{"Franklin St 1", "Rector St 1", "South Ferry 1"},
		{"Canal St J-N-Q-R", "City Hall R-W", "Rector St R-W"},
		{"South Ferry R-W", "Cortlandt St R-W", "Canal St J-N-Q-R"},
		{"Chambers St J-Z", "Fulton St", "Broad St J-Z"},
		{"Wall St 2-3", "Park Place 2-3", "Chambers St 1-2-3"},
		{"World Trade Center E", "Canal St A-C-E", "Chambers St A-C"},
		{"Bowling Green 4-5", "Wall St 4-5", "City Hall 4-5-6"},
		{"Green Park", "Piccadilly Circus", "Leicester Square"},
		{"Holborn", "Leicester Square", "Green Park"},
		{"Oxford Circus", "Tottenham Court Road", "Holborn"},
		{"Warren Street", "Tottenham Court Road", "Leicester Square"},
		{"Oxford Circus", "Warren Street", "King’s Cross St. Pancras"},
		{"Warren Street", "Oxford Circus", "Green Park"},
		{"Holborn", "Piccadilly Circus", "Green Park"},
		{"King’s Cross St. Pancras", "Warren Street", "Green Park"},
		{"Richelieu Drouot", "Grands Boulevards", "Bonne Nouvelle"},
		{"Réaumur Sébastopol", "Sentier", "Bourse"},
		{"St-Michel", "Cité", "Réaumur Sébastopol"},
		{"Pont Neuf", "Pont Marie", "Sully Morland"},
		{"Bonne Nouvelle", "Grands Boulevards", "Richelieu Drouot"},
		{"Bourse", "Sentier", "Réaumur Sébastopol"},
		{"Réaumur Sébastopol", "Cité", "St-Michel"},
		{"Sully Morland", "Pont Marie", "Pont Neuf"}
	};

	@Override
	protected SolveResult<SubwaysOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SubwaysInput input) {
		if(input == null || input.city() == null || input.commuter() == null || input.day() == null) {
			return failure("Select the city, commuter, and day shown on the module");
		}

		String[] schedule = SCHEDULES[input.city().ordinal()][input.commuter().ordinal()][input.day().ordinal()].split("\\|", 2);
		int route = Integer.parseInt(schedule[0]);
		String time = BATTERY.equals(schedule[1]) ? batteryTime(bomb.getBatteryCount()) : schedule[1];
		SubwaysOutput output = new SubwaysOutput(route, time, List.of(ROUTES[route - 1]));
		storeState(module, "input", input);
		return success(output);
	}

	private static String batteryTime(int batteries) {
		int hour = Math.floorMod(batteries, 24);
		return (hour % 12 == 0 ? 12 : hour % 12) + (hour < 12 ? " AM" : " PM");
	}
}
