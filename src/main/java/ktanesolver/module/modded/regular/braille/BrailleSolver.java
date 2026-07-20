package ktanesolver.module.modded.regular.braille;

import static java.util.stream.Collectors.toUnmodifiableMap;

import java.util.ArrayList;
import java.util.Arrays;
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

@Service
@ModuleInfo(
	type = ModuleType.BRAILLE,
	id = "braille",
	name = "Braille",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Repair four Braille cells using the serial number, decode the word, and press the indicated cell.",
	tags = {"Braille", "word", "serial number", "Souvenir", "modded"}
)
public class BrailleSolver extends AbstractModuleSolver<BrailleInput, BrailleOutput> {
	private static final Map<Integer, String> BRAILLE = parsePatterns("""
		a=1 b=12 c=14 d=145 e=15 f=124 g=1245 h=125 i=24 j=245
		k=13 l=123 m=134 n=1345 o=135 p=1234 q=12345 r=1235 s=234 t=2345 u=136 v=1236
		x=1346 y=13456 z=1356 and=12346 for=123456 of=12356 the=2346 with=23456 ch=16 gh=126 sh=146
		th=1456 wh=156 ed=1246 er=12456 ou=1256 ow=246 w=2456 ea=2 bb=23 cc=25 en=26 ff=235
		gg=2356 in=35 st=34 ar=345 ing=346
		""");
	private static final Map<String, Integer> SOLUTIONS = parseSolutions("""
		acting=3 dating=4 heading=1 meaning=3 server=4 aiming=1 dealer=3 hearing=1 miners=4 shaking=1
		artist=2 eating=2 heating=2 nearer=1 sought=1 asking=4 eighth=2 higher=2 parish=4 staying=1
		bearing=4 farmer=4 insist=3 parker=4 strands=2 beating=3 farming=2 lasted=3 parking=1 strings=4
		beings=1 faster=1 laying=2 paying=4 teaching=1 binding=2 father=1 leader=4 powers=1 tended=4
		bought=4 finding=1 leading=4 pushed=1 tender=1 boxing=4 finest=3 leaned=4 pushing=2 testing=3
		breach=2 finish=4 leaning=4 rather=3 throwing=3 breast=1 flying=2 leaving=1 reaching=3 towers=4
		breath=3 foster=2 linking=1 reader=1 vested=3 breathe=3 fought=3 listed=2 reading=1 warned=3
		bringing=3 gaining=3 listen=1 resting=3 warning=2 brings=3 gather=4 living=4 riding=2 weaker=3
		carers=2 gazing=4 making=3 rushed=2 wealth=2 carter=3 gender=4 marked=1 rushing=1 winner=2
		charter=2 growing=4 marking=1 saying=2 winning=3 crying=4 headed=2 master=2 served=2 winter=3
		""");

	@Override
	protected SolveResult<BrailleOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, BrailleInput input
	) {
		if (input == null || input.patterns() == null || input.patterns().size() != 4) {
			return failure("Enter all 4 Braille patterns");
		}
		if (input.patterns().stream().anyMatch(pattern -> pattern == null || pattern < 1 || pattern > 63)) {
			return failure("Each displayed Braille cell must contain at least one raised dot");
		}
		String serial = bomb.getSerialNumber();
		if (serial == null || serial.length() != 6 || !serial.matches("[A-Z0-9]{6}")) return failure("Enter a valid serial number");

		List<Integer> corrected = new ArrayList<>(input.patterns());
		int position = 0;
		for (char character : serial.toCharArray()) {
			position = (position + (Character.isDigit(character) ? character - '0' : character - 'A' + 1)) % 24;
			corrected.set(position / 6, corrected.get(position / 6) ^ 1 << position % 6);
			position++;
		}

		StringBuilder word = new StringBuilder();
		for (int i = 0; i < corrected.size(); i++) {
			String token = BRAILLE.get(corrected.get(i));
			if (token == null) return failure("Corrected cell " + (i + 1) + " is not a valid Braille symbol");
			word.append(token);
		}
		Integer pressPosition = SOLUTIONS.get(word.toString());
		if (pressPosition == null) return failure("The corrected Braille patterns do not decode to a listed word");

		storeState(module, "braillePatterns", List.copyOf(input.patterns()));
		return success(new BrailleOutput(word.toString(), pressPosition));
	}

	private static Map<Integer, String> parsePatterns(String value) {
		return Arrays.stream(value.split("\\s+")).filter(token -> !token.isBlank()).map(token -> token.split("="))
			.collect(toUnmodifiableMap(parts -> dots(parts[1]), parts -> parts[0]));
	}

	private static Map<String, Integer> parseSolutions(String value) {
		return Arrays.stream(value.split("\\s+")).filter(token -> !token.isBlank()).map(token -> token.split("="))
			.collect(toUnmodifiableMap(parts -> parts[0], parts -> Integer.parseInt(parts[1])));
	}

	private static int dots(String value) {
		return value.chars().map(dot -> 1 << dot - '1').reduce(0, (left, right) -> left | right);
	}
}
