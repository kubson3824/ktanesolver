package ktanesolver.module.modded.regular.jukebox;

import java.util.ArrayList;
import java.util.Comparator;
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
	type = ModuleType.JUKEBOX,
	id = "jukebox",
	name = "The Jukebox",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify the song and press the displayed lyrics in song order.",
	tags = {"music", "lyrics", "ordering", "modded"}
)
public class JukeboxSolver extends AbstractModuleSolver<JukeboxInput, JukeboxOutput> {
	private static final List<Song> SONGS = List.of(
		new Song("Who Wants to Live Forever?", "Time", "Place", "What", "Thing", "Builds", "Dreams", "Slips", "Away"),
		new Song("Take a Chance on Me", "Change", "Mind", "Honey", "Still", "Free", "Take", "Me"),
		new Song("Take Me to Church", "Lover's", "Humour", "Funeral", "Knows", "Everybody's", "Should", "Have", "Sooner"),
		new Song("Take on Me", "We're", "Talking", "Away", "Don't", "Know", "Anyway"),
		new Song("Africa", "Hear", "Drums", "Tonight", "Hears", "Quiet", "Conversation"),
		new Song("A Little Less Conversation", "Less", "Conversation", "More", "Action", "Please", "Aggravation", "Satisfaction", "Me"),
		new Song("The Flood", "Standing", "Edge", "Forever", "Start", "Whatever", "Shouting", "Love", "World"),
		new Song("All the Small Things", "All", "Things", "True", "Care", "Truth", "Brings", "Take", "Ride", "Trip"),
		new Song("Friday I'm in Love", "Don't", "Care", "Monday's", "Blue", "Grey", "Wednesday"),
		new Song("Y.M.C.A.", "There's", "Need", "Feel", "Down", "Yourself", "Ground"),
		new Song("Free Bird", "Leave", "Tomorrow", "Still", "Remember", "Travelling", "Many", "Places", "See"),
		new Song("Goodbye Mr. A", "Hole", "Logic", "Know", "Answers", "Claim", "Science", "Magic", "Buy"),
		new Song("Pure Shores", "Crossed", "Deserts", "Miles", "Swam", "Water", "Searching", "Piece", "Something"),
		new Song("Skin", "Heard", "Sound", "Walls", "Came", "Down", "Thinking", "You"),
		new Song("Oh My God", "Time", "Side", "End", "Beautiful", "Thing", "Spend"),
		new Song("Say Something", "Something", "Giving", "You", "One", "Want"),
		new Song("You Don't Know Me", "Give", "Hand", "Then", "Hello", "Hardly", "Speak", "Heart"),
		new Song("Hello", "Hello", "Me", "Wondering", "After", "Years", "Meet"),
		new Song("Heal the World", "Place", "Heart", "Know", "Love", "Could", "Much", "Brighter", "Tomorrow"),
		new Song("Up Where We Belong", "Knows", "Tomorrow", "Brings", "World", "Few", "Hearts", "Survive"),
		new Song("Do You Hear the People Sing?", "Hear", "People", "Sing", "Songs", "Men", "Music", "Will", "Again"),
		new Song("Save Rock'n'Roll", "Need", "More", "Dreams", "Less", "Life", "Dark", "Light"),
		new Song("Perfect", "Found", "Love", "Me", "Darling", "Dive", "Right", "Follow", "Lead"),
		new Song("Make Your Own Kind of Music", "Nobody", "Tell", "There's", "One", "Song", "Singing"),
		new Song("How to Save a Life", "Step", "One", "Need", "Talk", "Walks", "Sit", "Down")
	);

	@Override
	protected SolveResult<JukeboxOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, JukeboxInput input
	) {
		if (input == null || input.lyrics() == null || input.lyrics().size() != 3) {
			return failure("Enter the three displayed lyrics from top to bottom");
		}
		List<String> lyrics = input.lyrics().stream().map(JukeboxSolver::normalize).toList();
		if (lyrics.stream().anyMatch(String::isBlank) || lyrics.stream().distinct().count() != 3) {
			return failure("Enter three different displayed lyrics");
		}

		List<Song> matches = SONGS.stream().filter(song -> song.containsAll(lyrics)).toList();
		if (matches.size() != 1) return failure("Those lyrics do not identify exactly one Jukebox song");

		Song song = matches.getFirst();
		List<Integer> pressPositions = new ArrayList<>(List.of(1, 2, 3));
		pressPositions.sort(Comparator.comparingInt(position -> song.indexOf(lyrics.get(position - 1))));
		storeState(module, "input", new JukeboxInput(input.lyrics().stream().map(String::trim).toList()));
		return success(new JukeboxOutput(song.title(), List.copyOf(pressPositions)));
	}

	private static String normalize(String lyric) {
		return lyric == null ? "" : lyric.trim().replace('’', '\'').toLowerCase(Locale.ROOT);
	}

	private record Song(String title, List<String> lyrics) {
		Song(String title, String... lyrics) {
			this(title, List.of(lyrics).stream().map(JukeboxSolver::normalize).toList());
		}

		boolean containsAll(List<String> displayed) {
			return lyrics.containsAll(displayed);
		}

		int indexOf(String lyric) {
			return lyrics.indexOf(lyric);
		}
	}
}
