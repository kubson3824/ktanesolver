package ktanesolver.module.modded.regular.schlag_den_bomb;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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
	type = ModuleType.SCHLAG_DEN_BOMB,
	id = "qSchlagDenBomb",
	name = "Schlag den Bomb",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Classify 15 games and reconstruct the displayed final scores.",
	tags = {"games", "scores", "contestant", "edgework"}
)
public class SchlagDenBombSolver extends AbstractModuleSolver<SchlagDenBombInput, SchlagDenBombOutput> {
	private static final List<Profile> PROFILES = List.of(
		new Profile("Ron",0,0,0),new Profile("Don",0,0,1),new Profile("Julia",0,0,2),new Profile("Cory",0,1,0),new Profile("Greg",0,1,1),new Profile("Paula",0,1,2),new Profile("Val",0,2,0),new Profile("Lisa",0,2,1),new Profile("Ozy",0,2,2),
		new Profile("Ozzy",1,0,0),new Profile("Elsa",1,0,1),new Profile("Cori",1,0,2),new Profile("Harry",1,1,0),new Profile("Gale",1,1,1),new Profile("Daniel",1,1,2),new Profile("Albert",1,2,0),new Profile("Spike",1,2,1),new Profile("Tommy",1,2,2),
		new Profile("Greta",2,0,0),new Profile("Tina",2,0,1),new Profile("Rob",2,0,2),new Profile("Edgar",2,1,0),new Profile("Julie",2,1,1),new Profile("Peter",2,1,2),new Profile("Millie",2,2,0),new Profile("Isolde",2,2,1),new Profile("Eris",2,2,2)
	);
	private static final int[][] PORT_STEPS={{2,19,7},{3,12,4},{11,1,6},{3,3,3},{11,9,10},{7,2,9},{6,14,3}};
	private static final int[][] BATTERY_STEPS={{11,3,4},{6,2,8},{3,7,1},{4,9,1},{11,9,2},{7,11,4}};
	private static final int[][] INDICATOR_STEPS={{1,1,1},{1,2,1},{1,1,1},{1,2,1}};

	@Override
	protected SolveResult<SchlagDenBombOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SchlagDenBombInput input) {
		if (input == null || input.contestantName() == null || input.contestantScore() == null || input.bombScore() == null) return failure("Enter the contestant name and both displayed scores");
		Profile profile = PROFILES.stream().filter(candidate -> candidate.name().equalsIgnoreCase(input.contestantName().trim())).findFirst().orElse(null);
		if (profile == null) return failure("The contestant name is not recognized");
		if (input.contestantScore() < 0 || input.contestantScore() > 75 || input.bombScore() < 0 || input.bombScore() > 75) return failure("Both displayed scores must be from 0 through 75");
		if (input.contestantScore() == 60) return failure("The module rerolls every result where the contestant finishes on exactly 60");
		if (bomb == null || bomb.getSerialNumber() == null || bomb.getSerialNumber().length() != 6) return failure("Enter the six-character serial number");

		Assignment assignment;
		try { assignment = assign(bomb, profile); }
		catch (IllegalArgumentException exception) { return failure(exception.getMessage()); }
		for (int mask = 0; mask < 64; mask++) {
			boolean[] winners = assignment.fixedWins().clone();
			for (int i = 0; i < assignment.oddballs().size(); i++) winners[assignment.oddballs().get(i)] = (mask & (1 << i)) != 0;
			Simulation simulation = simulate(winners);
			if (simulation.contestantScore() == input.contestantScore() && simulation.bombScore() == input.bombScore()) {
				List<Integer> contestantGames = new ArrayList<>(), bombGames = new ArrayList<>(), unplayedGames = new ArrayList<>();
				for (int game = 0; game < 15; game++) {
					if (simulation.unplayed()[game]) unplayedGames.add(game + 1);
					else if (winners[game]) contestantGames.add(game + 1);
					else bombGames.add(game + 1);
				}
				storeState(module, "schlagContestantName", profile.name());
				storeState(module, "schlagContestantScore", input.contestantScore());
				storeState(module, "schlagBombScore", input.bombScore());
				return success(new SchlagDenBombOutput(contestantGames,bombGames,unplayedGames,List.of(assignment.types()),profile.name(),input.contestantScore(),input.bombScore()));
			}
		}
		return failure("Those two scores are not possible for this contestant and edgework");
	}

	static Assignment assign(BombEntity bomb, Profile profile) {
		int[] serial = bomb.getSerialNumber().toUpperCase(Locale.ROOT).chars().map(character -> {
			if (Character.isDigit(character)) return character - '0';
			if (character >= 'A' && character <= 'Z') return character - 'A' + 1;
			throw new IllegalArgumentException("The serial number may contain only letters and digits");
		}).toArray();
		String[] types = new String[15]; java.util.Arrays.fill(types,"X");
		List<Integer> oddballs = new ArrayList<>(); boolean[] fixedWins = new boolean[15];
		int first = serial[0] == 0 ? 15 : serial[0] > 15 ? serial[0] - 15 : serial[0];
		int current = first - 1; types[current]="O"; oddballs.add(current);
		for (int i=1;i<6;i++) { current=next(types,current,serial[i]==0?1:serial[i]); types[current]="O"; oddballs.add(current); }
		int ports=Math.min(6,bomb.getPortPlates().stream().mapToInt(plate->plate.getPorts().size()).sum());
		int batteries=Math.min(5,bomb.getBatteryCount()), indicators=Math.min(3,bomb.getIndicators().size());
		current=assignCategory(types,fixedWins,current,PORT_STEPS[ports],"P",profile.physical());
		current=assignCategory(types,fixedWins,current,BATTERY_STEPS[batteries],"M",profile.mental());
		assignCategory(types,fixedWins,current,INDICATOR_STEPS[indicators],"Q",profile.quiz());
		return new Assignment(types,fixedWins,List.copyOf(oddballs));
	}
	private static int assignCategory(String[] types,boolean[] wins,int current,int[] steps,String type,int rating){for(int i=0;i<3;i++){current=next(types,current,steps[i]);types[current]=type;if(i<rating)wins[current]=true;}return current;}
	private static int next(String[] types,int current,int steps){int remaining=steps;do{current=(current+1)%15;if(types[current].equals("X"))remaining--;}while(remaining>0);return current;}
	private static Simulation simulate(boolean[] winners){int contestant=0,bomb=0;boolean[]unplayed=new boolean[15];for(int game=0;game<15;game++){if(contestant>60||bomb>60)unplayed[game]=true;else if(winners[game])contestant+=game+1;else bomb+=game+1;}return new Simulation(contestant,bomb,unplayed);}
	record Profile(String name,int physical,int mental,int quiz){}
	record Assignment(String[]types,boolean[]fixedWins,List<Integer>oddballs){}
	private record Simulation(int contestantScore,int bombScore,boolean[]unplayed){}
}
