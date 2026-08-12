import { solveModule } from "../lib/api";

export const FESTIVE_JUKEBOX_WORDS = [...new Set([
  "Christmas", "Time", "Afraid", "Light", "Banish", "Shade",
  "Feigning", "Surprise", "Gifts", "Mulled", "Month", "Time",
  "Wind", "Blowing", "Streets", "Dark", "Letter", "Start",
  "Hanging", "Stocking", "Time", "Santa", "Reindeer", "Sleigh",
  "Snow", "Christmas", "Peace", "Earth", "Raining", "Virgin",
  "Eve", "Tank", "Old", "Another", "Sang", "Song",
  "Christmas", "Time", "Outside", "Presents", "Parking", "Credit",
  "Snowman", "Snow", "Might", "Great", "Smile", "Face",
  "Reindeer", "Mastermind", "Run", "Rudolph", "Randalph", "Behind",
  "Snow", "Falling", "Children", "Season", "Understanding", "Christmas",
  "Christmas", "Sentimental", "Religious", "Rather", "Bread", "Honest",
  "Home", "Christmas", "Wait", "Faces", "Moving", "Line",
  "Angels", "Sing", "Glory", "Peace", "Earth", "God",
  "Christmas", "Heart", "Next", "Year", "Tears", "Someone",
  "Weather", "Outside", "Delightful", "Since", "Place", "Snow",
  "Christmas", "Song", "Year", "Card", "Nice", "Here",
  "Kringle", "Bells", "Jingle", "Waiting", "Christmas", "Coming",
  "Night", "Holy", "Calm", "Bright", "Virgin", "Mild",
  "Christmas", "Need", "Care", "Presents", "Underneath", "Tree",
  "Better", "Watch", "Cry", "Pout", "Claus", "Coming",
])];

export interface FestiveJukeboxOutput {
  songTitle: string;
  artist: string;
  positions: number[];
  orderedWords: string[];
}

export const solveFestiveJukebox = (
  roundId: string,
  bombId: string,
  moduleId: string,
  words: string[],
): Promise<{ output: FestiveJukeboxOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { words });
