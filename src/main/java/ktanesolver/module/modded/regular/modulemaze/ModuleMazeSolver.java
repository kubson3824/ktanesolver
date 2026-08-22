package ktanesolver.module.modded.regular.modulemaze;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
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
    type = ModuleType.MODULE_MAZE,
    id = "ModuleMaze",
    name = "Module Maze",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Find a shortest route between the two module icons in the fixed 20×20 maze.",
    tags = {"maze", "modules", "icons", "navigation"}
)
public class ModuleMazeSolver extends AbstractModuleSolver<ModuleMazeInput, ModuleMazeOutput> {
    public static final List<String> ICONS = """
        Wire Sequence
        Wires
        Who’s on First
        Venting Gas
        Simon Says
        Password
        Morse Code
        Memory
        Maze
        Knob
        Keypad
        Complicated Wires
        Capacitor Discharge
        The Button
        Colour Flash
        Piano Keys
        Semaphore
        Math
        Emoji Math
        Lights Out
        Switches
        Two Bits
        Word Scramble
        Anagrams
        Combination Lock
        Filibuster
        Motion Sense
        Square Button
        Simon States
        Round Keypad
        Listening
        Foreign Exchange Rates
        Answering Questions
        Orientation Cube
        Morsematics
        Connection Check
        Letter Keys
        Forget Me Not
        Rotary Phone
        Astrology
        Logic
        Crazy Talk
        Adventure Game
        Turn The Keys
        Turn The Key
        Mystic Square
        Plumbing
        Cruel Piano Keys
        Safety Safe
        Tetris
        Cryptography
        Chess
        Mouse In The Maze
        3D Maze
        Silly Slots
        Number Pad
        Probing
        Resistors
        Skewed Slots
        Caesar Cipher
        Perspective Pegs
        Microcontroller
        Murder
        The Gamepad
        Tic Tac Toe
        Who’s That Monsplode
        Monsplode, Fight!
        Shape Shift
        Follow the Leader
        Friendship
        The Bulb
        Alphabet
        Blind Alley
        Sea Shells
        English Test
        Rock-Paper-Scissors-Lizard-Spock
        Hexamaze
        Bitmaps
        Colored Squares
        Adjacent Letters
        Third Base
        Souvenir
        Word Search
        Broken Buttons
        Simon Screams
        Laundry
        Modules Against Humanity
        Complicated Buttons
        Battleship
        Text Field
        Symbolic Password
        Wire Placement
        Double-Oh
        Cheap Checkout
        Coordinates
        Light Cycle
        HTTP Response
        Rhythms
        Color Math
        Only Connect
        Neutralization
        Web Design
        Chord Qualities
        Creation
        Rubik’s Cube
        FizzBuzz
        The Clock
        LED Encryption
        Edgework
        Bitwise Operations
        Fast Math
        Minesweeper
        Zoo
        Binary LEDs
        Boolean Venn Diagram
        Point of Order
        Ice Cream
        Hex To Decimal
        The Screw
        Yahtzee
        X-Ray
        QR Code
        Button Masher
        Random Number Generator
        Color Morse
        Mastermind Cruel
        Mastermind Simple
        Gridlock
        Big Circle
        Morse-A-Maze
        Colored Switches
        Perplexing Wires
        Monsplode Trading Cards
        Game of Life Cruel
        Game of Life Simple
        Nonogram
        S.E.T.
        Refill that Beer!
        Painting
        Color Generator
        Shape Memory
        Symbol Cycle
        Hunting
        Extended Password
        Curriculum
        Braille
        Mafia
        Festive Piano Keys
        Flags
        Timezone
        Polyhedral Maze
        Symbolic Coordinates
        Poker
        Sonic the Hedgehog
        Poetry
        Button Sequence
        Algebra
        Visual Impairment
        The Jukebox
        Identity Parade
        Maintenance
        Blind Maze
        Backgrounds
        Mortal Kombat
        Mashematics
        Faulty Backgrounds
        Radiator
        Modern Cipher
        LED Grid
        Sink
        The iPhone
        The Swan
        Waste Management
        Human Resources
        Skyrim
        Burglar Alarm
        Press X
        European Travel
        Error Codes
        Rapid Buttons
        LEGOs
        Rubik’s Clock
        Font Select
        The Stopwatch
        Pie
        The Wire
        The London Underground
        Logic Gates
        Forget Everything
        Grid Matching
        Color Decoding
        The Sun
        Playfair Cipher
        Tangrams
        The Number
        Cooking
        Superlogic
        The Moon
        The Cube
        Dr. Doctor
        Tax Returns
        The Jewel Vault
        Digital Root
        Graffiti Numbers
        Marble Tumble
        X01
        Logical Buttons
        The Code
        Tap Code
        Simon Sings
        Simon Sends
        Synonyms
        Greek Calculus
        Simon Shrieks
        Complex Keypad
        Subways
        Lasers
        Turtle Robot
        Guitar Chords
        Calendar
        USA Maze
        Binary Tree
        The Time Keeper
        Lightspeed
        Black Hole
        Simon’s Star
        Morse War
        The Stock Market
        Mineseeker
        Maze Scrambler
        The Number Cipher
        Alphabet Numbers
        British Slang
        Double Color
        Maritime Flags
        Equations
        Determinants
        Pattern Cube
        Know Your Way
        Splitting The Loot
        Simon Samples
        Character Shift
        Uncolored Squares
        Dragon Energy
        Flashing Lights
        3D Tunnels
        Synchronization
        The Switch
        Reverse Morse
        Manometers
        Shikaku
        Wire Spaghetti
        Tennis
        Module Homework
        Benedict Cumberbatch
        Signals
        Horrible Memory
        Boggle
        Command Prompt
        Boolean Maze
        Sonic & Knuckles
        Quintuples
        The Sphere
        Coffeebucks
        Colorful Madness
        Bases
        Lion’s Share
        Snooker
        Blackjack
        Party Time
        Accumulation
        The Plunger Button
        The Digit
        The Jack-O’-Lantern
        T-Words
        Divided Squares
        Connection Device
        Instructions
        Valves
        Encrypted Morse
        The Crystal Maze
        Cruel Countdown
        Countdown
        Catchphrase
        Blockbusters
        IKEA
        Retirement
        Periodic Table
        101 Dalmatians
        Schlag den Bomb
        Mahjong
        Kudosudoku
        The Radio
        Modulo
        Number Nimbleness
        Pay Respects
        Challenge & Contact
        The Triangle
        Sueet Wall
        Hot Potato
        Christmas Presents
        Hieroglyphics
        Functions
        Scripting
        Needy Mrs Bob
        Simon Spins
        Ten-Button Color Code
        Cursed Double-Oh
        Crackbox
        Street Fighter
        The Labyrinth
        Spinning Buttons
        Color Match
        The Festive Jukebox
        Skinny Wires
        The Hangover
        Factory Maze
        Binary Puzzle
        Broken Guitar Chords
        Regular Crazy Talk
        Hogwarts
        Dominoes
        Simon Speaks
        Discolored Squares
        Flip The Coin
        Krazy Talk
        Numbers
        Simon’s Stages
        Free Parking
        Cookie Jars
        Alchemy
        Varicolored Squares
        Simon Squawks
        Zoni
        Mad Memory
        Unrelated Anagrams
        Bartending
        Question Mark
        Shapes And Bombs
        Flavor Text
        Flavor Text EX
        Decolored Squares
        Homophones
        DetoNATO
        Air Traffic Controller
        SYNC-125 [3]
        Westeros
        Morse Identification
        Pigpen Rotations
        LED Math
        Alphabetical Order
        Simon Sounds
        The Fidget Spinner
        Simon’s Sequence
        Simon Scrambles
        Harmony Sequence
        Unfair Cipher
        Melody Sequencer
        Colorful Insanity
        Gadgetron Vendor
        Passport Control
        Left and Right
        Wingdings
        The Hexabutton
        The Plunger
        Genetic Sequence
        Micro-Modules
        Elder Futhark
        Module Maze
        Tasha Squeals
        Forget This
        Digital Cipher
        Draw
        Grocery Store
        Burger Alarm
        Subscribe to Pewdiepie
        Purgatory
        Mega Man 2
        Lombax Cubes
        The Stare
        Graphic Memory
        Timing is Everything
        Quiz Buzz
        Wavetapping
        The Hypercube
        Speak English
        Stack’em
        Seven Wires
        Colored Keys
        The Troll
        Planets
        The Necronomicon
        Four-Card Monte
        aa
        The Witness
        The Giant’s Drink
        Digit String
        Alpha
        Snap!
        Hidden Colors
        """.lines().toList();

    // Bit 0: connection to the right. Bit 1: connection downward.
    private static final String EDGES =
        "1230301130331113031032301122130231030130211132323031133032303131010302031031012222230212332231033022" +
        "2221113220323030101222231221322230302230301301030221303311321211231030231101120213233121121223031322" +
        "1222301311131310302222101222130221023212322111122313230302222131213230102303223011312222223103102030" +
        "1121132123331031231213031012122111121120121131131222310232301131132232231102211211011010011111111010";
    private static final char[] DIRECTIONS = {'U', 'R', 'D', 'L'};
    private static final int[] DELTAS = {-20, 1, 20, -1};

    @Override
    protected SolveResult<ModuleMazeOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, ModuleMazeInput input
    ) {
        if (input == null) return failure("Choose the starting and destination icons");
        int start = iconIndex(input.startingIcon());
        int destination = iconIndex(input.destinationIcon());
        if (start < 0 || destination < 0) return failure("Choose valid Module Maze icon names");
        if (start == destination) return failure("The starting and destination icons must be different");

        String route = shortestRoute(start, destination);
        String startingIcon = ICONS.get(start);
        String destinationIcon = ICONS.get(destination);
        storeState(module, "moduleMazeStartingIcon", startingIcon);
        return success(new ModuleMazeOutput(startingIcon, destinationIcon, route, route.length()));
    }

    private static String shortestRoute(int start, int destination) {
        int[] previous = new int[ICONS.size()];
        char[] moves = new char[ICONS.size()];
        Arrays.fill(previous, -1);
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        previous[start] = start;
        queue.add(start);

        while (!queue.isEmpty() && previous[destination] < 0) {
            int current = queue.removeFirst();
            for (int direction = 0; direction < DIRECTIONS.length; direction++) {
                if (!connected(current, direction)) continue;
                int next = current + DELTAS[direction];
                if (previous[next] >= 0) continue;
                previous[next] = current;
                moves[next] = DIRECTIONS[direction];
                queue.addLast(next);
            }
        }

        List<Character> reversed = new ArrayList<>();
        for (int current = destination; current != start; current = previous[current]) reversed.add(moves[current]);
        StringBuilder route = new StringBuilder(reversed.size());
        for (int i = reversed.size() - 1; i >= 0; i--) route.append(reversed.get(i));
        return route.toString();
    }

    private static boolean connected(int cell, int direction) {
        int row = cell / 20;
        int column = cell % 20;
        return switch (direction) {
            case 0 -> row > 0 && edge(cell - 20, 2);
            case 1 -> column < 19 && edge(cell, 1);
            case 2 -> row < 19 && edge(cell, 2);
            case 3 -> column > 0 && edge(cell - 1, 1);
            default -> false;
        };
    }

    private static boolean edge(int cell, int bit) {
        return ((EDGES.charAt(cell) - '0') & bit) != 0;
    }

    private static int iconIndex(String value) {
        if (value == null) return -1;
        String normalized = normalize(value);
        for (int i = 0; i < ICONS.size(); i++) if (normalize(ICONS.get(i)).equals(normalized)) return i;
        return -1;
    }

    private static String normalize(String value) {
        return value.trim().replace('’', '\'').replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }
}
