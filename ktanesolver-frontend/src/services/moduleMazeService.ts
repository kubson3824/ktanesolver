import { solveModule } from "../lib/api";

export const MODULE_MAZE_ICONS = `Wire Sequence
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
Hidden Colors`.split("\n");

export interface ModuleMazeOutput {
  startingIcon: string;
  destinationIcon: string;
  route: string;
  moveCount: number;
}

export const solveModuleMaze = (
  roundId: string, bombId: string, moduleId: string, startingIcon: string, destinationIcon: string,
): Promise<{ output: ModuleMazeOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { startingIcon, destinationIcon });
