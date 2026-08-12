package ktanesolver.module.modded.regular.regularcrazytalk;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class RegularCrazyTalkRules {
    private static final Pattern PLACEHOLDER = Pattern.compile(
        "\\[(?:([A-C])|([A-C]): ([^\\]]*)|!([^\\]\\|]*)\\|(\\d+)-(\\d+):([^\\]]*?)|([^\\]\\|]+))\\]"
    );
    private static final List<String> PHRASES = List.of(
        "We just blew up.",
        "We ran out of time.",
        "You cut out.",
        "You just cut out.",
        "Were you saying something?",
        "Did you say something?",
        "I can’t hear you, you’re breaking up.",
        "You’re breaking up.",
        "Repeat?",
        "Please repeat.",
        "[A] batteries in [B] holders.",
        "Forget Me Not stage [A] is a [B].",
        "No Christmas crackers.",
        "Don’t wash tennis balls.",
        "There’s no decoy.",
        "How do I know which one’s the decoy?",
        "Decoy is [A: Rock|Paper|Scissors|Lizard|Spock].",
        "How the heck am I supposed to pronounce this?",
        "Black is on the [A: left|right], no poop.",
        "Mind the gap.",
        "Honk honk.",
        "You have violated an area protected by a security system.",
        "Welcome to Coffeebucks, may I take your name please?",
        "[A: Point of Order|Poker|Blackjack] is [B: Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Jack|Queen|King] of [C: Spades|Hearts|Clubs|Diamonds].",
        "I need [A: Big Circle|Blind Maze|Combination Lock|Laundry|Press X] for [B] solved.",
        "I forgot we have a [A: Turn the Key|Forget Me Not|Forget Everything|Souvenir].",
        "I forgot to mention we have a [A: Turn the Key|Forget Me Not|Forget Everything|Souvenir].",
        "Do I turn the right key?",
        "What does a [A: parallel|serial|DVI|DVI-D|PS/2|RCA|Stereo RCA|RJ|RJ-45|USB] port look like again?",
        "What do you call the [A: small square port|small round port|port with two holes|empty module] again?",
        "Hold on, I have a phone call.",
        "Hold on, I’m getting a phone call.",
        "Hold on, I’m doing [A: Turn the Key|a Battleship|English Test|Digital Root|Mastermind|Minesweeper|Anagrams|Word Scramble|a Swan|the needy|push-ups].",
        "Never mind.",
        "Quiet, I’m preparing Safety Safe.",
        "Quiet please, I’m preparing Safety Safe.",
        "Please be quiet, I’m preparing Safety Safe.",
        "Does this version count for Turn the Keys?",
        "Why is there vanilla on this bomb?",
        "Whoops, I hit a wall.",
        "I’m gonna kill this bomb.",
        "That was a fake strike, don’t worry.",
        "Tell me when to initiate.",
        "How do I know if it’s [A: Blind Alley or Tap Code|Colored or Uncolored Squares|Anagrams or Word Scramble|Simon Screams or Shrieks|Crazy Talk or Regular|Regular Crazy Talk or non|Beach or Waterfall|papers or sapper|Sonic & Knuckles or just Sonic|vanilla or translated]?",
        "Hang on, gotta wait for an even minute.",
        "I think this is [A: Taxi Dispatch|Extractor Fan|Train Station|Arcade|Casino|Supermarket|Soccer Match|Tawny Owl|Sewing Machine|Thrush Nightingale|Car Engine|Reloading Glock|Oboe|Saxophone|Tuba|Marimba|Phone Ringing|Tibetan Nuns|Throat Singing|Beach|Dial-up Internet|Police Radio Scanner|Censorship Bleep|Medieval Weapons|Door Closing|a bug|Chainsaw|Compressed Air|Servo Motor|Waterfall|Tearing Fabric|Zipper|Vacuum Cleaner|Ballpoint Pen Writing|Rattling Iron Chain|Book Page Turning|Table Tennis|Squeeky Toy|Helicopter|Firework Exploding|Glass Shattering].",
        "It’s [A: Johnny Cage|Kano|Liu Kang|Raiden|Scorpion|Sonya|Sub-Zero] versus [B: Johnny Cage|Kano|Liu Kang|Raiden|Scorpion|Sonya|Sub-Zero].",
        "Text Field is [A: Alfa|Bravo|Charlie|Delta|Echo|Foxtrot|easy].",
        "Here I’ll post a log.",
        "Where do you find the logfile again?",
        "Wait, hold on, let’s do another module first.",
        "Maritime Flags is going by too fast.",
        "You Are One.",
        "You Are One, three words.",
        "You Are One, two letters and a number.",
        "You Are One, with the NATO.",
        "U R 1.",
        "U R 1, three words.",
        "U R 1, with the NATO.",
        "Uniform Romeo 1.",
        "Uniform Romeo 1, three words.",
        "Uniform Romeo 1, with the NATO.",
        "[A: Morse Code|Morse-A-Maze|Reverse Morse|Color Morse|The Cube rotations|Flashing Lights|Simon Sends], waiting for the reset.",
        "Your.",
        "Your, Why Oh You Are.",
        "You’re.",
        "Your apostrophe.",
        "You’re apostrophe.",
        "Your possessive.",
        "You’re possessive.",
        "You are words.",
        "UR words.",
        "The game crashed.",
        "The game just crashed.",
        "Oops, the game crashed.",
        "Oops, the game crashed. Literally unplayable!",
        "What are the numbers for The Swan again?",
        "I missed a Swan reset.",
        "Letters on Swan.",
        "",
        "It displays nothing.",
        "It displays nothing at all.",
        "It displays literally nothing.",
        "It literally displays nothing.",
        "Literally nothing.",
        "It’s blank.",
        "It’s literally blank.",
        "Literally blank.",
        "It’s actually blank.",
        "Exactly what it says.",
        "Exectly what it says.",
        "This is exactly what it says.",
        "Exactly what is says. Exactly is misspelled.",
        "This is exactly what it says: exactly what it says.",
        "That’s what it says.",
        "That’s what the module says.",
        "Yeah, that’s what it says.",
        "Yeah, that’s what the module says.",
        "No, that’s what it says.",
        "No, that’s what the module says.",
        "No no no, that’s what the module says.",
        "The buttons don’t do anything.",
        "Who’s the one with the loud keyboard?",
        "Please mute yourself.",
        "You should mute yourself.",
        "Are we friends on [A: Steam|Discord|Facebook|MySpace|Skype]?",
        "I have an idea for a new module.",
        "I have a great idea for a new module.",
        "I have an idea for a new needy module.",
        "I forgot to enable your profile.",
        "Oops, I forgot to enable your profile.",
        "So what profiles are we using?",
        "It’s still loading.",
        "Hold on, it’s still loading.",
        "Hold on, the lights just went out.",
        "Hold on, gotta turn off the alarm clock.",
        "Gotta turn off the alarm clock.",
        "[A: ABC|ABD|ABH|ACD|ACH|ADH|BCD|BCH|BDH|CDH].",
        "My letters are [A: ABC|ABD|ABH|ACD|ACH|ADH|BCD|BCH|BDH|CDH].",
        "3D Maze, my letters are [A: ABC|ABD|ABH|ACD|ACH|ADH|BCD|BCH|BDH|CDH].",
        "Gridlock, [A: red|blue|green|yellow] star at [B: Alfa|Bravo|Charlie|Delta]-[C: 1|2|3|4], pressing next.",
        "Let me find the torus.",
        "Let me find a sphere.",
        "I thought this module was disabled.",
        "I thought I disabled [A: Forget Me Not|Forget Everything|Souvenir|Turn the Key|Turn the Keys|The Cube|Tax Returns|Laundry|needies|vanilla|the alarm clock].",
        "I thought I’d disabled [A: Forget Me Not|Forget Everything|Souvenir|Turn the Key|Turn the Keys|The Cube|Tax Returns|Laundry|needies|vanilla|the alarm clock].",
        "I thought I had disabled [A: Forget Me Not|Forget Everything|Souvenir|Turn the Key|Turn the Keys|The Cube|Tax Returns|Laundry|needies|vanilla|the alarm clock].",
        "Can you do [A: The Cube|The Sphere|Tax Returns|LEGO|Laundry|Black Hole|Jewel Vault|me a favor|Simon Sings|Simon Sends|Turtle Robot|3D Tunnels|Pattern Cube|me a favour|Splitting The Loot|Coffeebucks|Kudosudoku|Regular Crazy Talk]?",
        "We solved the bomb.",
        "We did it, we solved the bomb.",
        "We did it, bomb [A: disarmed|solved|defused|diffused].",
        "Do you wanna play [A: Fortnite|PUBG|CS:GO|Challenge & Contact|the piano]?",
        "Crazy Talk. All words. Quote the phrase the word stop twice end quote.",
        "Crazy Talk. Ready?",
        "Crazy Talk. Ready? Quote.",
        "Why is there a Regular Crazy Talk on this bomb?",
        "Is this Regular Crazy Talk or non?",
        "Not Regular. I meant Crazy Talk.",
        "Actually, it’s just Crazy Talk.",
        "I think this module has a bug.",
        "All available experts please report to room A-9.",
        "Emergency cleared. All experts report to your stations.",
        "All personnel please evacuate to your nearest pod and report to your supervisor.",
        "Contact.",
        "Challenge 3 2 1.",
        "Challenge three two one.",
        "Challenge. 3, 2, 1.",
        "Challenge. Three, two, one.",
        "She sells sea shells on the sea shore.",
        "She sells sea shells by the sea shore.",
        "Sea shells she sells on the sea shore.",
        "Sea shells she sells by the sea shore.",
        "It’s the one with the sea shells.",
        "Imagine an imaginary menagerie manager imagining managing an imaginary menagerie.",
        "Imagine an imaginary menagerie manager managing an imaginary menagerie.",
        "Imagine an imaginary menagerie manager imagining managing a menagerie.",
        "Imagine an imaginary menagerie managed by an imaginary menagerie manager.",
        "Imagine a menagerie manager imagining managing an imaginary menagerie.",
        "Imagine a menagerie manager imagining an imaginary menagerie.",
        "Imagine a menagerie managed by an imaginary menagerie manager.",
        "Imagine a menagerie managed by an imaginary menagerie manager imagining a menagerie.",
        "Imagine a menagerie managed by a menagerie manager imagining managing a menagerie.",
        "It’s the one with the menagerie manager.",
        "Any progress on [any module name]?",
        "Light Cycle is [!a sequence of six colors|6-6:red/green/blue/magenta/yellow/white].",
        "The Screw is [!a sequence of six colors|6-6:red/green/blue/magenta/yellow/white].",
        "[!a sequence of rhyming words|3-6:boat/coat/float/gloat/goat/moat/note/oat/quote/rote/stoat/throat/vote/wrote].",
        "Never mind, the module solved itself.",
        "Never mind, it solved itself.",
        "Never mind, Regular Crazy Talk solved itself.",
        "Wait, we have a [A: Forget Me Not|Forget Everything|Souvenir|Swan|Fast Math|needy].",
        "I missed stage [A] on [B: Forget Me Not|Forget Everything].",
        "What?",
        "What’s the correct phrase on Regular Crazy Talk?"
    );
    private static final List<Rule> RULES = buildRules();

    private RegularCrazyTalkRules() {}

    static Result lookup(String displayedPhrase) {
        if (displayedPhrase == null) return null;
        String phrase = unwrap(displayedPhrase.trim());
        for (Rule rule : RULES) {
            Matcher matcher = rule.pattern().matcher(phrase);
            if (!matcher.matches()) continue;
            int[] letters = {-1, -1, -1};
            for (int index = 0; index < letters.length; index++) {
                Resolver resolver = rule.letters()[index];
                if (resolver != null) letters[index] = resolver.resolve(matcher);
            }
            int[] values = Arrays.stream(rule.tokens()).mapToInt(token ->
                token.literal() == null ? letters[token.letter()] : token.literal()).toArray();
            if (Arrays.stream(values).anyMatch(value -> value < 0 || value > 9)) return null;
            return new Result(values[0], values[1], values[2], modifier(displayedPhrase.trim()));
        }
        return null;
    }

    static String modifier(String phrase) {
        if (phrase.startsWith("It says: “") && phrase.endsWith("”")) return "It says: “[PHRASE]”";
        if (phrase.startsWith("“It says: ") && phrase.endsWith("”")) return "“It says: [PHRASE]”";
        if (phrase.startsWith("It says: ")) return "It says: [PHRASE]";
        if (phrase.startsWith("Quote: ") && phrase.endsWith(" End quote")) return "Quote: [PHRASE] End quote";
        if (phrase.startsWith("“") && phrase.endsWith("”")) return "“[PHRASE]”";
        return "[PHRASE]";
    }

    private static String unwrap(String phrase) {
        if (phrase.startsWith("It says: “") && phrase.endsWith("”")) return phrase.substring("It says: “".length(), phrase.length() - 1);
        if (phrase.startsWith("“It says: ") && phrase.endsWith("”")) return phrase.substring("“It says: ".length(), phrase.length() - 1);
        if (phrase.startsWith("It says: ")) return phrase.substring("It says: ".length());
        if (phrase.startsWith("Quote: ") && phrase.endsWith(" End quote")) return phrase.substring("Quote: ".length(), phrase.length() - " End quote".length());
        if (phrase.startsWith("“") && phrase.endsWith("”")) return phrase.substring(1, phrase.length() - 1);
        return phrase;
    }

    private static List<Rule> buildRules() {
        MonoRandom random = new MonoRandom(1);
        List<Integer> digits = new ArrayList<>();
        for (int digit = 0; digit < 10; digit++) digits.add(digit);
        List<Rule> rules = new ArrayList<>();
        for (String template : PHRASES) {
            random.shuffle(digits);
            Object[] values = {digits.get(0), digits.get(1), digits.get(2)};
            Resolver[] letters = new Resolver[3];
            StringBuilder regex = new StringBuilder("^");
            Matcher placeholder = PLACEHOLDER.matcher(template);
            int end = 0;
            int group = 0;
            while (placeholder.find()) {
                regex.append(Pattern.quote(template.substring(end, placeholder.start())));
                if (placeholder.group(1) != null) {
                    int letter = placeholder.group(1).charAt(0) - 'A';
                    int capture = ++group;
                    regex.append("([0-9])");
                    letters[letter] = matcher -> Integer.parseInt(matcher.group(capture));
                    values[letter] = Character.valueOf((char) ('A' + letter));
                } else if (placeholder.group(3) != null) {
                    int letter = placeholder.group(2).charAt(0) - 'A';
                    String[] options = placeholder.group(3).split("\\|", -1);
                    List<Integer> numbers = new ArrayList<>();
                    while (numbers.size() < options.length) for (int digit = 0; digit < 10; digit++) numbers.add(digit);
                    random.shuffle(numbers);
                    Map<String, Integer> optionValues = new HashMap<>();
                    StringBuilder alternatives = new StringBuilder();
                    for (int index = 0; index < options.length; index++) {
                        if (index > 0) alternatives.append('|');
                        alternatives.append(Pattern.quote(options[index]));
                        optionValues.put(options[index].toLowerCase(Locale.ROOT), numbers.get(index));
                    }
                    int capture = ++group;
                    regex.append('(').append(alternatives).append(')');
                    letters[letter] = matcher -> optionValues.getOrDefault(matcher.group(capture).toLowerCase(Locale.ROOT), -1);
                    values[letter] = Character.valueOf((char) ('A' + letter));
                } else if (placeholder.group(4) != null) {
                    int maximumLength = Integer.parseInt(placeholder.group(6));
                    String[] options = placeholder.group(7).split("/", -1);
                    List<Integer> order = new ArrayList<>();
                    for (int index = 0; index < options.length; index++) order.add(index);
                    random.shuffle(order);
                    int capture = ++group;
                    regex.append("(.+?)");
                    for (int letter = 0; letter < 3; letter++) {
                        String target = options[order.get(letter)];
                        int offset = random.next(0, 10 - maximumLength);
                        letters[letter] = sequenceResolver(capture, target, options, offset);
                        values[letter] = Character.valueOf((char) ('A' + letter));
                    }
                } else {
                    regex.append("(?:.+?)");
                }
                end = placeholder.end();
            }
            regex.append(Pattern.quote(template.substring(end))).append('$');
            List<Object> shuffled = new ArrayList<>(Arrays.asList(values));
            random.shuffle(shuffled);
            Token[] tokens = shuffled.stream().map(value -> value instanceof Integer integer
                ? new Token(integer, -1) : new Token(null, (Character) value - 'A')).toArray(Token[]::new);
            rules.add(new Rule(Pattern.compile(regex.toString(), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE), tokens, letters));
        }
        return List.copyOf(rules);
    }

    private static Resolver sequenceResolver(int group, String target, String[] options, int offset) {
        return matcher -> {
            String sequence = matcher.group(group).toLowerCase(Locale.ROOT);
            List<String> items = new ArrayList<>();
            Matcher words = Pattern.compile(String.join("|", Arrays.stream(options).map(Pattern::quote).toList()), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE).matcher(sequence);
            while (words.find()) items.add(words.group().toLowerCase(Locale.ROOT));
            return offset + items.indexOf(target.toLowerCase(Locale.ROOT));
        };
    }

    record Result(int expectedDigit, int hold, int release, String modifier) {}
    private record Rule(Pattern pattern, Token[] tokens, Resolver[] letters) {}
    private record Token(Integer literal, int letter) {}
    @FunctionalInterface private interface Resolver { int resolve(Matcher matcher); }

    private static final class MonoRandom {
        private final int[] seedArray = new int[56];
        private int inext;
        private int inextp = 31;

        private MonoRandom(int seed) {
            int subtraction = seed == Integer.MIN_VALUE ? Integer.MAX_VALUE : Math.abs(seed);
            int mj = 161803398 - subtraction;
            seedArray[55] = mj;
            int mk = 1;
            for (int index = 1; index < 55; index++) {
                int ii = 21 * index % 55;
                seedArray[ii] = mk;
                mk = mj - mk;
                if (mk < 0) mk += Integer.MAX_VALUE;
                mj = seedArray[ii];
            }
            for (int pass = 1; pass < 5; pass++) {
                for (int index = 1; index < 56; index++) {
                    seedArray[index] -= seedArray[1 + (index + 30) % 55];
                    if (seedArray[index] < 0) seedArray[index] += Integer.MAX_VALUE;
                }
            }
        }

        private int next(int minimum, int maximum) {
            if (maximum - minimum <= 1) return minimum;
            if (++inext >= 56) inext = 1;
            if (++inextp >= 56) inextp = 1;
            int value = seedArray[inext] - seedArray[inextp];
            if (value < 0) value += Integer.MAX_VALUE;
            seedArray[inext] = value;
            return (int) (value * (1.0 / Integer.MAX_VALUE) * (maximum - minimum)) + minimum;
        }

        private <T> void shuffle(List<T> values) {
            for (int remaining = values.size(); remaining > 1;) {
                int index = next(0, remaining);
                remaining--;
                T value = values.get(index);
                values.set(index, values.get(remaining));
                values.set(remaining, value);
            }
        }
    }
}
