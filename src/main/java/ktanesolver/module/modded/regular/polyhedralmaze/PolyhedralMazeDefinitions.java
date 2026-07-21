package ktanesolver.module.modded.regular.polyhedralmaze;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.BitSet;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;

final class PolyhedralMazeDefinitions {
	static final Set<Integer> START_FACES = Set.of(0, 13, 15, 29, 31, 35);

	// ponytail: default rule seed only; add ruleSeed + MonoRandom generator when non-default seeds are required.
	static final Map<String, Solid> SOLIDS = Map.ofEntries(
		Map.entry("4-Truncated Deltoidal Icositetrahedron", solid("777777777777777777777777444444444444444444",
			"Ah4IGgUiAQAiBBwNJgIBJgwYBh4ABR8LGREnBAMnEBwBIgUEIgAaCR8DCB4CGBQoBwYoEx0KIwgHIwkaAB4GCx8FGggjCgkjBx0WKQsKKRUZAx8JDiAUGAImDQwmARwQJA4NJA8bEiAMESEXGw4kEA8kDRwEJxEQJwMZFSEPFCAOGxclExIlFh0HKBQTKAYYDCASFyERGQspFhUpCh0TJRcWJRIbDyEVAgwUBgsVEQMACAkFDxcSDgEEEA0TFgoHBggAAgMFCQsMDhIUFRcPEQUEAQAIBwoJDg0QDxcWExINDAIBBAMREAcGFBMWFQsK",
			"/wpQJCEpVBL1AgX8V/4lIAmZSqegPBX49Uj4qrEh")),
		Map.entry("Chamfered Dodecahedron", solid("666666666666666666666666666666555555555555",
			"AiIIGiYBACYEHB4CAR4MGCIABSMZER8EAx8cASYFBCYaCSMDCCIYFCAHBiAdCicIBycaACIGCyMFGicKCScHHSELCiEVGSMJDiQYAh4NDB4cECgODSgbEiQMESUXGygQDygNHB8REB8DGSUPFCQOGykTEikWHSAUEyAGGCQSFyUZCyEWFSEdEykXFikbDyUVBiICDCQUFSURAyMLCCcJBSYAFykSDigPBB8QDR4BByATFiEKAgEcDQwREBwEAxQTHQcGCwodFhUAAhgGCAkLGQMFEhQYDA4PERkVFwEAGgUECgkaCAcQDxsODRMSGxcW",
			"fwFKalSQq4JA5B/9lZgpKFkg6USSyo8+IeHDIpAc")),
		Map.entry("Chamfered Icosahedron", solid("66666666666666666666666666666633333333333333333333",
			"FB4TCCABACAIGiwCASwaDiINCx8KFysEAysXDiMFBCMOHS0cEy4SDyQHBiQPGDAIBzAYASAAECUPFS8KCS8VAx8LCh8DHCEbFyYWFCoNDCoUAiIODSICBSMEByQGCSUQDyUJGzEREDEbGSkYFigVBi4TEi4GAB4UEx4ADSoMCi8JEigWFSgSDCYXFiYMBCsDCDAHESkZGCkRHScaGScdAiwBETEQCyEcGyELBS0dHC0FGicZEwAUAwsKAQAIGwscAg4NBA4FBg8HEA8JFxYMGhkdEhYVERkYDQwUAxcEARoCBR0cExIGCRUKBxgIGxEQ",
			"fyAK9oJQJGNJ4x/9ERgpTHk3m0KJ46/LvGTKoTWu")),
		Map.entry("Deltoidal Hexecontahedron", solid("444444444444444444444444444444444444444444444444444444444444",
			"BA40AQAzGgIBGRgDAhcrBAMqCgAJEy8GBS4VBwYUHQgHHDoJCDkPBQ4EKgsKKR8MCx4nDQwmNQ4NNAAKEwk5EA84JBEQIyISESEwExIvBQ8YHQcVFAYuFhUtLBcWKwMYFwIZFB0YAhoZATMbGjI7HBs6CB0cBxQZIicMHx4LKSAfKDEhIDASIiERIx4nIhEkIxA4JSQ3NiYlNQ0nJgweIywxICkoHwsqKQoEKyoDFywrFi0oMSwWLi0VBi8uBRMwLxIhMTAgKC02OxszMhoBNDMADjU0DSY2NSU3Mjs2JTg3JBA5OA8JOjkIHDs6GzI3",
			"f9gbWtrY+fWhnZoltFv8+IX15YW5ZRqcu0I60qP5")),
		Map.entry("Disdyakis Dodecahedron", solid("333333333333333333333333333333333333333333333333",
			"BxcBACYCASUDAhgEAx8FBCoGBSkHBhAADxMJCC4KCS0LChwMCxsNDCIODSEPDhQIFwcRECgSES8TEggUEw8VFCAWFScXFgAQHwMZGCQaGSMbGgwcGwsdHCweHSsfHgQYJxUhIA4iIQ0jIhokIxklJAImJQEnJhYgLxEpKAYqKQUrKh4sKx0tLAouLQkvLhIo",
			"fyf3/9z/7idP7/v3nt9+7TvJ")),
		Map.entry("Joined Snub Cube (laevo)", solid("444444444444444444444444444444444444444444444444444444444444",
			"Axo4AQAmMgIBLDoDAiAwAAcjOQUELzMGBSk7BwYdMQQLGDAJCB81CgkhMQsKHDQIDyoyDQwlNw4NJzMPDi42DBMZNBEQGzsSESg3ExIkOBAXIjUVFB46FhUrNhcWLTkUGjAIGRg0EBoZOAAYHTsRHBs0Cx0cMQcbIDoVHx41CSAfMAMeIzEKIiE1FCMiOQQhJjgTJSQ3DSYlMgEkKTMOKCc3EikoOwYnLDIMKyo2FiwrOgIqLzkXLi02Dy8uMwUtAyAIGAcdCiEBJgwqBS8OJwscEBkJHxQiDy4WKw0lEigTJAAaFy0EIxUeAiwRGwYp",
			"34OiO6Pd+/3cRZ5FHRz4+jP82CFapodd4sll3ZUa")),
		Map.entry("Joined Rhombicuboctahedron", solid("444444444444444444444444444444444444444444444444",
			"AxokAQAmKgIBLB4DAiAYAAcdIQUEIy0GBS8nBwYpGwQLGCAJCB8iCgkhHQsKHBkIDyUoDQwnLw4NLisPDiomDBMZHBEQGykSESglExIkGhAXHiwVFCsuFhUtIxcWIh8UGgMIGRgLEBoZEwAYHQcRHBsQCx0cCgQbIAIUHx4XCSAfCAMeIwQKIiEJFyMiFgUhJgATJSQSDCYlDwEkKQYNKCcMEikoEQcnLAEPKyoOFSwrFAIqLwUWLi0VDi8uDQYt",
			"P8bmeaZd+/84XJxdPnb4+jP4YlbYPS4k")),
		Map.entry("Pentagonal Hexecontahedron (laevo)", solid("555555555555555555555555555555555555555555555555555555555555",
			"ATQOCgQCGjM0AAMYGRoBBCsXGAIACiorAwYvEw8JBxUuLwUIHRQVBgk6HB0HBQ85OggLKgQADgwfKSoKDSceHwsONSYnDAoANDUNEDkJBRMRJDg5DxIiIyQQEzAhIhEPBS8wEhUHHRkYFi4GBxQXLC0uFRgDKywWFBkCAxcaAhgUHRszAQIZHDsyMxodCDo7GxkUBwgcHwwnIyIgKQsMHiExKCkfIhIwMSAeIxESISQRIh4nJTgQESMmNjc4JCcNNTYlIx4MDSYpIDEtLCoLHyAoKwQKCyksFwMEKigtFhcrLhYsKDEvBhUWLTATBQYuMSESEy8tKCAhMDMbOzc2NAEaGzI1DgABMzYmDQ40MjclJjU4JTYyOzkQJCU3OgkPEDg7HAgJOTcyGxw6",
			"v9KSkxRIKdG+/LDAUmvXYcIS//owyR+rTJESlCQaMV9JShSBJgk=")),
		Map.entry("Orthokis Propello Cube", solid("444444444444444444444444333333333333333333333333",
			"AgggAQAEKAIBDBgABREpBAMBIwUECR8DCBQtBwYKIQgHABsGCwUiCgkHLAsKFRwJDgIrDQwQJQ4NEhkMERcmEA8NKhEQAx4PFA4kExIWLhQTBhoSFwsvFhUTJxcWDx0VGwIZGA4aGRQbGggYHwsdHBceHREfHgUcIwAhIAciIQkjIgQgJxIlJA0mJQ8nJhYkKwEpKAMqKRArKgwoLwotLAYuLRMvLhUs",
			"H+pdXtLF/venH9rlffj3/z/J8exH")),
		Map.entry("Pentakis Dodecahedron", solid("333333333333333333333333333333333333333333333333333333333333",
			"BAoBADQCARoDAhgEAysACQ8GBS8HBhUIBx0JCDoFDgALCioMCx8NDCcODTUKEwUQDzkRECQSESITEjAPGBkVFAcWFS4XFiwYFwMUHRQaGQIbGjMcGzsdHAgZIiMfHgwgHykhIDEiIRIeJx4kIxElJDgmJTYnJg0jLC0pKCAqKQsrKgQsKxcoMSguLRYvLgYwLxMxMCEtNjczMhs0MwE1NA42NSYyOzI4NyU5OBA6OQk7Ohw3",
			"b3y5n//vf8x+Ct/7f/7x8rz5f9y3kws=")),
		Map.entry("Rectified Rhombicuboctahedron", solid("44444444444444444444444444444444444444444433333333",
			"ExYXEhUYGRQbHB0aHyAhHiMkJSInKCkmEhwbExQaHRUWHiEXGCAfGRokIxscJikdHiIlHyAoJyEiFhMjJBQZJSYSFycoGBUpABAsBgYqDgABDysHBy0RAQAOLggIMBAAARExCQkvDwECBysKCioGAgIGLAsLLQcCAwguDAwvCQMDCTENDTAIAwQMLg4OKgoEBAorDw8vDAQFCywQEDANBQUNMRERLQsFGyMTFCQaEiYcHSkVFiIeHyUZIScXGCgg",
			"f77rwVSl+vijq5Klyynx8V33HU+zl7aQ")),
		Map.entry("Triakis Icosahedron", solid("333333333333333333333333333333333333333333333333333333333333",
			"AiYBADACAQYABQsEAzUFBCcDCAIHBjgIByoGCy8KCTkLCgMJDiwNDBAODSQMESkQDw0REC0PFDITEhYUEzYSFzsWFRMXFjMVGigZGB8aGSUYHSscGyIdHC4bIDEfHhkgHzQeIzoiIRwjIjchJg4lJBomJQAkKQUoJxgpKA8nLAgrKhssKwwqLxEuLR0vLgktMgExMB4yMRIwNRc0MyA1NAQzOBQ3NiM4Nwc2Owo6OSE7OhU5",
			"n/nN/+jvsz85ncf7G+/vsb/P8uL78wc=")),
		Map.entry("Rhombicosidodecahedron", solid("55555555555544444444444444444444444444444433333333333333333333",
			"DBwoIBARISgdDRIiKR4ODx8pIxMUDCQOFhcPJQ0VGhIkEBgZESUTGxwUJhUdHxcmFh4hGScYICIaJxsjBDYAKisBNwUsAjgEBTkDLSoAOgYHOwErBjwCLC0DPQcINgQuLwU3CC4EOAkJOQUvMAY6Cgo7BzELPAYwMQc9CwA2CDIyCDcBMwk4AgM5CTM0CjoAATsKNAI8CzU1Cz0DKgYsBAUtBysuCS8ICjELMDIBNAACNQMzECQMDSURDiQSEyUPFiYUFSYXGCcaGycZHSgcHikfICghIykiFBwMDR0VDh4WFx8PECAYGSERGiISEyMb",
			"X589Vrx2UXlfP0FWlGVUF1//u1/cibmNk5K3/Gzp")),
		Map.entry("Canonical Rectified Snub Cube (laevo)", solid("55555555555555555555555544444433333333333333333333333333333333",
			"GDQuHiYmNiIyGBk1Lx8nJzcjMxkYMjAgKCg4JDQYGTMxISkpOSU1GRo2Jh4qKjsjNxoaNycfKys6IjYaGzgoICwsPSU5Gxs5KSEtLTwkOBscOyoeLi40JDwcHTorHy8vNSU9HR09LCAwMDIiOh0cPC0hMTEzIzscAQQFAAMGBwIJCgsIDQ4PDBEWFxATFBUSABAIAhIKBBQMBhYOAQsVAwkXBQ8RBw0TAAgBAgoDBAwFBg4HCBAJChILDBQNDhYPEAAREgITFAQVFgYXARUEAxcGBREABxMCCwEICQMKDwUMDQcOFQsSFwkQEQ8WEw0U",
			"/+lOVymk7FK++hKvmSbmONL1ubxr78mSo7fU4spO"))
	);

	private PolyhedralMazeDefinitions() {}

	private static Solid solid(String degrees, String neighborData, String openData) {
		byte[] flat = Base64.getDecoder().decode(neighborData);
		int[][] neighbors = new int[degrees.length()][];
		int offset = 0;
		for (int face = 0; face < degrees.length(); face++) {
			int degree = degrees.charAt(face) - '0';
			neighbors[face] = new int[degree];
			for (int edge = 0; edge < degree; edge++) neighbors[face][edge] = Byte.toUnsignedInt(flat[offset++]);
		}
		if (offset != flat.length) throw new IllegalArgumentException("Invalid Polyhedral Maze topology data");
		return new Solid(neighbors, BitSet.valueOf(Base64.getDecoder().decode(openData)));
	}

	static String topologyHash() {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			SOLIDS.entrySet().stream().sorted(Map.Entry.comparingByKey()).forEach(entry -> {
				digest.update(entry.getKey().getBytes(StandardCharsets.UTF_8));
				digest.update((byte) 0);
				for (int[] face : entry.getValue().neighbors()) {
					digest.update((byte) face.length);
					for (int neighbor : face) digest.update((byte) neighbor);
				}
				digest.update((byte) 255);
				digest.update(entry.getValue().openEdges().toByteArray());
			});
			return HexFormat.of().formatHex(digest.digest());
		} catch (NoSuchAlgorithmException impossible) {
			throw new IllegalStateException(impossible);
		}
	}

	record Solid(int[][] neighbors, BitSet openEdges) {
		boolean isOpen(int face, int edge) {
			int bit = edge;
			for (int previous = 0; previous < face; previous++) bit += neighbors[previous].length;
			return openEdges.get(bit);
		}
	}
}
