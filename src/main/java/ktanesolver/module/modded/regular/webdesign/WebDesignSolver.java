package ktanesolver.module.modded.regular.webdesign;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
	type = ModuleType.WEB_DESIGN,
	id = "webDesign",
	name = "Web Design",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Score the displayed CSS and choose Accept, Consider, or Reject",
	tags = {"CSS", "colors", "web", "modded"}
)
public class WebDesignSolver extends AbstractModuleSolver<WebDesignInput, WebDesignOutput> {
	private static final Pattern ELEMENT = Pattern.compile("(?<![#.\\w-])([a-z][\\w-]*)", Pattern.CASE_INSENSITIVE);
	private static final Pattern ID = Pattern.compile("#([\\w-]+)");
	private static final Pattern CLASS = Pattern.compile("\\.([\\w-]+)");
	private static final Pattern COLOR = Pattern.compile("\\b(blue|yellow|red|green|white|orange|purple|magenta|gray)\\b", Pattern.CASE_INSENSITIVE);
	private static final List<Site> SITES = List.of(
		new Site("Edison Daily", set("body", "a", "h3", "blockquote"), set("header", "comments"), set("post", "title", "author"), 0, 255, 0),
		new Site("Buddymaker", set("div", "span", "img", "a"), set("msg", "cover", "content", "sidebar"), set("post", "title", "share"), 128, 64, 192),
		new Site("PNGdrop", set("div", "img"), set("main", "comments", "fullview"), set("username", "share", "large"), 186, 218, 85),
		new Site("BobIRS", set("ul", "ol", "img", "b", "i"), set("sidebar"), set("avatar", "username"), 3, 230, 30),
		new Site("Vidhost", set("div", "iframe", "b", "i"), set("main", "rating", "comments"), set("username", "share", "channel"), 96, 6, 30),
		new Site("Go Team Falcon online", set("body", "iframe"), set("rating", "comments"), set("rating", "fullscreen"), 80, 19, 55),
		new Site("Stufflocker", set("div", "h3", "img", "iframe"), set("sidebar", "download"), set("menu", "author"), 176, 32, 229),
		new Site("Steel Nexus", set("body", "div", "img", "blockquote"), set("header", "content", "sidebar"), set("avatar", "reply"), 190, 166, 30)
	);

	@Override
	protected SolveResult<WebDesignOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, WebDesignInput input
	) {
		if (input == null || input.css() == null || input.css().isBlank()) return failure("Enter the displayed CSS");
		if (input.coloredButtons() == null) return failure("Select the button appearance");

		String css = input.css().trim();
		int openBrace = css.indexOf('{');
		int closeBrace = css.lastIndexOf('}');
		if (openBrace <= 0 || closeBrace <= openBrace || !css.substring(closeBrace + 1).isBlank()) {
			return failure("Enter one complete CSS rule with a selector and curly braces");
		}

		String selector = css.substring(0, openBrace).trim();
		Site site = findSite(selector);
		if (site == null) return failure("The selector does not identify exactly one Web Design site");

		String body = css.substring(openBrace + 1, closeBrace).trim();
		if (body.isEmpty() || !body.endsWith(";")) return failure("Every CSS line must end with a semicolon");
		List<String> declarations = new ArrayList<>();
		for (String part : body.split(";")) if (!part.isBlank()) declarations.add(part.trim());
		if (declarations.isEmpty()) return failure("Enter at least one CSS line inside the curly braces");

		int score = declarations.size();
		int zIndexes = 0;
		boolean hasPosition = false;
		for (String declaration : declarations) {
			int colon = declaration.indexOf(':');
			if (colon <= 0 || colon == declaration.length() - 1) return failure("Each CSS line must contain a property and value");
			String property = declaration.substring(0, colon).trim().toLowerCase(Locale.ROOT);
			String value = declaration.substring(colon + 1).trim().toLowerCase(Locale.ROOT);
			switch (property) {
				case "margin", "padding" -> score += 2;
				case "border", "border-radius" -> {
					if (!value.equals("0px") && !value.equals("50%")) score++;
				}
				case "position" -> hasPosition = true;
				case "z-index" -> zIndexes++;
				case "font-family" -> score += value.replace("\"", "").replace("'", "").equals("comic sans ms") ? -5 : 1;
				case "box-shadow", "text-shadow" -> {
					if (!value.equals("none")) score += 2;
				}
				default -> { }
			}
		}
		if (!hasPosition) score -= zIndexes;

		ColorTarget target = firstColor(body);
		if (target.r() < site.r()) score += 3;
		if (target.g() >= site.g()) score += 3;
		if (target.b() > site.b()) score += 3;
		score = input.coloredButtons() ? score * 2 : score - 3;

		int adjustedScore = score;
		while (adjustedScore <= 0) adjustedScore += 16;
		int digitalRoot = (adjustedScore - 1) % 9 + 1;
		String answer = switch (digitalRoot) {
			case 2, 3, 5, 7 -> "ACCEPT";
			case 6, 8 -> "CONSIDER";
			default -> "REJECT";
		};

		storeState(module, "input", new WebDesignInput(css, input.coloredButtons()));
		return success(new WebDesignOutput(
			site.name(), target.hex(), score, adjustedScore, digitalRoot, answer
		));
	}

	private static Site findSite(String selector) {
		Set<String> elements = matches(ELEMENT, selector);
		Set<String> ids = matches(ID, selector);
		Set<String> classes = matches(CLASS, selector);
		if (elements.isEmpty() && ids.isEmpty() && classes.isEmpty()) return null;
		List<Site> matches = SITES.stream()
			.filter(site -> site.elements().containsAll(elements) && site.ids().containsAll(ids) && site.classes().containsAll(classes))
			.toList();
		return matches.size() == 1 ? matches.getFirst() : null;
	}

	private static Set<String> matches(Pattern pattern, String value) {
		Set<String> matches = new HashSet<>();
		Matcher matcher = pattern.matcher(value);
		while (matcher.find()) matches.add(matcher.group(1).toLowerCase(Locale.ROOT));
		return matches;
	}

	private static ColorTarget firstColor(String body) {
		Matcher matcher = COLOR.matcher(body);
		if (!matcher.find()) return new ColorTarget("#7F7F7F", 127, 127, 127);
		return switch (matcher.group(1).toLowerCase(Locale.ROOT)) {
			case "blue" -> new ColorTarget("#0000FF", 0, 0, 255);
			case "yellow" -> new ColorTarget("#FFFF00", 255, 255, 0);
			case "red" -> new ColorTarget("#FF0000", 255, 0, 0);
			case "green" -> new ColorTarget("#00FF00", 0, 255, 0);
			case "white" -> new ColorTarget("#FFFFFF", 255, 255, 255);
			case "orange" -> new ColorTarget("#FFA500", 255, 165, 0);
			case "purple" -> new ColorTarget("#800080", 128, 0, 128);
			case "magenta" -> new ColorTarget("#FF00FF", 255, 0, 255);
			default -> new ColorTarget("#808080", 128, 128, 128);
		};
	}

	private static Set<String> set(String... values) {
		return Set.of(values);
	}

	private record Site(String name, Set<String> elements, Set<String> ids, Set<String> classes, int r, int g, int b) {}
	private record ColorTarget(String hex, int r, int g, int b) {}
}
