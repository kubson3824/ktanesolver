package ktanesolver.module.modded.regular.festivejukebox;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
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
	type = ModuleType.FESTIVE_JUKEBOX,
	id = "festiveJukebox",
	name = "The Festive Jukebox",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify the Christmas song and press its three displayed lyrics in song order.",
	tags = {"music", "words", "ordering", "christmas"}
)
public class FestiveJukeboxSolver extends AbstractModuleSolver<FestiveJukeboxInput, FestiveJukeboxOutput> {
	static final List<Song> SONGS = List.of(
		new Song("Feed the World (Do They Know It's Christmas?)", "Band Aid", List.of("Christmas", "Time", "Afraid", "Light", "Banish", "Shade")),
		new Song("Christmas Time (Don't Let the Bells End)", "The Darkness", List.of("Feigning", "Surprise", "Gifts", "Mulled", "Month", "Time")),
		new Song("All Alone on Christmas", "Darlene Love", List.of("Wind", "Blowing", "Streets", "Dark", "Letter", "Start")),
		new Song("Merry Christmas Everybody", "Slade", List.of("Hanging", "Stocking", "Time", "Santa", "Reindeer", "Sleigh")),
		new Song("I Believe in Father Christmas", "Greg Lake", List.of("Snow", "Christmas", "Peace", "Earth", "Raining", "Virgin")),
		new Song("Fairytale of New York", "The Pogues (ft. Kirsty MacColl)", List.of("Eve", "Tank", "Old", "Another", "Sang", "Song")),
		new Song("It's Never Gonna Snow (At Christmas)", "Chris Moyles", List.of("Christmas", "Time", "Outside", "Presents", "Parking", "Credit")),
		new Song("I Wish it Could be Christmas Every Day", "Wizzard", List.of("Snowman", "Snow", "Might", "Great", "Smile", "Face")),
		new Song("Run Rudolph, Run", "Bryan Adams", List.of("Reindeer", "Mastermind", "Run", "Rudolph", "Randalph", "Behind")),
		new Song("Merry Christmas Everyone", "Shakin' Stevens", List.of("Snow", "Falling", "Children", "Season", "Understanding", "Christmas")),
		new Song("White Wine in the Sun", "Tim Minchin", List.of("Christmas", "Sentimental", "Religious", "Rather", "Bread", "Honest")),
		new Song("Driving Home for Christmas", "Chris Rea", List.of("Home", "Christmas", "Wait", "Faces", "Moving", "Line")),
		new Song("Hark! The Herald Angels Sing", "The Choir of King's College, Cambridge", List.of("Angels", "Sing", "Glory", "Peace", "Earth", "God")),
		new Song("Last Christmas", "Wham!", List.of("Christmas", "Heart", "Next", "Year", "Tears", "Someone")),
		new Song("Let it Snow", "Dean Martin", List.of("Weather", "Outside", "Delightful", "Since", "Place", "Snow")),
		new Song("Step into Christmas", "Elton John", List.of("Christmas", "Song", "Year", "Card", "Nice", "Here")),
		new Song("Man With the Bag", "Jessie J", List.of("Kringle", "Bells", "Jingle", "Waiting", "Christmas", "Coming")),
		new Song("Silent Night", "The Choir of King's College, Cambridge", List.of("Night", "Holy", "Calm", "Bright", "Virgin", "Mild")),
		new Song("All I Want for Christmas is You", "Mariah Carey", List.of("Christmas", "Need", "Care", "Presents", "Underneath", "Tree")),
		new Song("Santa Claus is Coming to Town", "Ray Charles", List.of("Better", "Watch", "Cry", "Pout", "Claus", "Coming"))
	);

	@Override
	protected SolveResult<FestiveJukeboxOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, FestiveJukeboxInput input
	) {
		if (input == null || input.words() == null || input.words().size() != 3)
			return failure("Enter exactly three displayed words");
		if (input.words().stream().anyMatch(Objects::isNull))
			return failure("All three displayed words are required");

		List<String> entered = input.words().stream().map(String::trim).toList();
		if (entered.stream().anyMatch(String::isEmpty)
			|| entered.stream().map(word -> word.toLowerCase(Locale.ROOT)).distinct().count() != 3)
			return failure("The three displayed words must be non-empty and distinct");

		List<Song> matches = SONGS.stream()
			.filter(song -> entered.stream().allMatch(word -> indexOfIgnoreCase(song.words(), word) >= 0))
			.toList();
		if (matches.size() != 1)
			return failure(matches.isEmpty()
				? "Those words do not identify a song"
				: "Those words identify more than one song; check the displayed words");

		Song song = matches.getFirst();
		List<Integer> lyricRanks = entered.stream().map(word -> indexOfIgnoreCase(song.words(), word)).toList();
		List<Integer> order = new ArrayList<>(List.of(0, 1, 2));
		order.sort(Comparator.comparingInt(lyricRanks::get));
		List<Integer> positions = order.stream().map(index -> index + 1).toList();
		List<String> orderedWords = order.stream().map(index -> song.words().get(lyricRanks.get(index))).toList();

		return success(new FestiveJukeboxOutput(song.title(), song.artist(), positions, orderedWords));
	}

	private static int indexOfIgnoreCase(List<String> values, String target) {
		for (int index = 0; index < values.size(); index++)
			if (values.get(index).equalsIgnoreCase(target)) return index;
		return -1;
	}

	record Song(String title, String artist, List<String> words) {}
}
