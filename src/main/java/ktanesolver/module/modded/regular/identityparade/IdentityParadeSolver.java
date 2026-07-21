package ktanesolver.module.modded.regular.identityparade;

import java.util.HashSet;
import java.util.List;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.identityparade.IdentityParadeInput.Attire;
import ktanesolver.module.modded.regular.identityparade.IdentityParadeInput.Build;
import ktanesolver.module.modded.regular.identityparade.IdentityParadeInput.HairColor;
import ktanesolver.module.modded.regular.identityparade.IdentityParadeInput.Suspect;

@Service
@ModuleInfo(
	type = ModuleType.IDENTITY_PARADE,
	id = "identityParade",
	name = "Identity Parade",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify the only displayed suspect matching all three listed traits.",
	tags = {"names", "traits", "deduction", "Souvenir"}
)
public class IdentityParadeSolver extends AbstractModuleSolver<IdentityParadeInput, IdentityParadeOutput> {
	@Override
	protected SolveResult<IdentityParadeOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, IdentityParadeInput input
	) {
		if(input == null || !valid(input.hairColors(), 3) || !valid(input.builds(), 3)
			|| !valid(input.attires(), 3) || !valid(input.suspects(), 9)) {
			return failure("Select 3 different hair colors, builds, and attires, plus 9 different suspects");
		}

		List<Suspect> matches = input.suspects().stream().filter(suspect -> {
			Profile profile = profile(suspect);
			return input.hairColors().contains(profile.hairColor())
				&& input.builds().contains(profile.build())
				&& input.attires().contains(profile.attire());
		}).toList();
		if(matches.size() != 1) return failure("The listed traits must identify exactly one displayed suspect");

		Suspect suspect = matches.getFirst();
		Profile profile = profile(suspect);
		storeState(module, "hairColors", input.hairColors());
		storeState(module, "builds", input.builds());
		storeState(module, "attires", input.attires());
		return success(new IdentityParadeOutput(suspect, profile.hairColor(), profile.build(), profile.attire()));
	}

	private static boolean valid(List<?> values, int size) {
		return values != null && values.size() == size && values.stream().noneMatch(java.util.Objects::isNull)
			&& new HashSet<>(values).size() == size;
	}

	private static Profile profile(Suspect suspect) {
		return switch(suspect) {
			case ANDY -> new Profile(HairColor.BROWN, Build.HUNCHED, Attire.SUIT);
			case BEN -> new Profile(HairColor.GREY, Build.TALL, Attire.T_SHIRT);
			case CHRISSIE -> new Profile(HairColor.RED, Build.HUNCHED, Attire.HOODIE);
			case DYLAN -> new Profile(HairColor.BLONDE, Build.SHORT, Attire.TANK_TOP);
			case EDDIE -> new Profile(HairColor.GREY, Build.SLIM, Attire.SUIT);
			case FIONA -> new Profile(HairColor.BROWN, Build.TALL, Attire.HOODIE);
			case GEMMA -> new Profile(HairColor.GREY, Build.SHORT, Attire.BLAZER);
			case HARRIET -> new Profile(HairColor.BLACK, Build.FAT, Attire.T_SHIRT);
			case IAN -> new Profile(HairColor.WHITE, Build.TALL, Attire.JUMPER);
			case JAMES -> new Profile(HairColor.RED, Build.MUSCULAR, Attire.TANK_TOP);
			case KAYLEIGH -> new Profile(HairColor.WHITE, Build.SHORT, Attire.TANK_TOP);
			case LOUISE -> new Profile(HairColor.BLONDE, Build.FAT, Attire.SUIT);
			case MEGAN -> new Profile(HairColor.BROWN, Build.SLIM, Attire.BLAZER);
			case NATE -> new Profile(HairColor.RED, Build.FAT, Attire.JUMPER);
			case OSCAR -> new Profile(HairColor.BLACK, Build.SLIM, Attire.HOODIE);
			case PENNY -> new Profile(HairColor.BLONDE, Build.MUSCULAR, Attire.T_SHIRT);
			case QUENTIN -> new Profile(HairColor.WHITE, Build.HUNCHED, Attire.BLAZER);
			case RHIANNON -> new Profile(HairColor.BLACK, Build.MUSCULAR, Attire.JUMPER);
		};
	}

	private record Profile(HairColor hairColor, Build build, Attire attire) {}
}
