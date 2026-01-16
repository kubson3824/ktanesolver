
package ktanesolver.utils;

public class StringUtils {
	public static int upperLetterToNumber(char letter) {
		return letter - 'A';
	}

	public static int lowerLetterToNumber(char letter) {
		return letter - 'a';
	}

	public static char numberToUpperLetter(int number) {
		return (char)(number + 'A');
	}

	public static char numberToLowerLetter(int number) {
		return (char)(number + 'a');
	}

	public static int upperLetterToNumber1Based(char letter) {
		return letter - 'A' + 1;
	}

	public static int lowerLetterToNumber1Based(char letter) {
		return letter - 'a' + 1;
	}

	public static char numberToUpperLetter1Based(int number) {
		return (char)(number - 1 + 'A');
	}

	public static char numberToLowerLetter1Based(int number) {
		return (char)(number - 1 + 'a');
	}
}
