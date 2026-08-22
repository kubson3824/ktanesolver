package ktanesolver.module.modded.regular.crypticpassword;

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
@ModuleInfo(type = ModuleType.CRYPTIC_PASSWORD, id = "CrypticPassword", name = "Cryptic Password",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Encrypt the starting word with the displayed key using the default rule-seed table.",
    tags = {"password", "cipher", "rule seed", "vigenere"})
public class CrypticPasswordSolver extends AbstractModuleSolver<CrypticPasswordInput, CrypticPasswordOutput> {
    static final String[] TABLE = {
        "CSBMEADXUQKORZINGVLPHTYWFJ","HNYPUQBLSZIOGVKADCEMRJTWXF","YHQKLBJWFGSXOTCIZAEMUDNPRV","LIOEDNHXGTZMFBUCSJQVYKPRAW","FASCVJPRZKIHYDGOQXUBELWNMT","DCSANGXVLTKJIMQRFOPBWUYEHZ","NDRZPCFGOWAJYMIBKVXSLTQHEU","GPMEAIBSWUFXJCHKYTORZVLNQD","PEQMDJSWICNORVTBXYGUHKZFLA","IGQLODJKBUPAHFNXSMZYRVETWC","MDSVBHQALCNKGIPWZUOXJTFRYE","LOTZQYCKWEFHAIJUNPXDGMBRSV","TSDQRFJMZWCHOEAKXPLINYBGVU",
        "RFMZCASGDPKBHUJONYVTWQEXIL","QJONFZPLUARTVIKSDXHWBCEGMY","GQRLTFBUADKHOXSVIWZEMYJPCN","SZKDNPQVGFRWCBEHULTJYOIXMA","EDOMBUASPIKYHNFRVWZCQXGJLT","KLYZCNDUTHIGPASVXBWQFROJEM","GBFSOWHJPLTRNDZAQUIVKXYEMC","WEXDGNRFAMPBVHUKZSTLJQCOIY","XRMONJFQPLCIDKZBSGTVYHWAEU","HXIFEUPGMCDZVNWRSKTBJQLYOA","ROJNWGTDICYBUVEKMQZXSHALFP","RIQJFXCUBNOWEDVPGLSYMHTZAK","WJGQKYOCNBHFTMUDSLAZPEVXRI"
    };

    @Override protected SolveResult<CrypticPasswordOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, CrypticPasswordInput input) {
        if (input == null) return failure("Enter the starting word and key word");
        String starting = letters(input.startingWord()), key = letters(input.keyWord());
        if (starting == null || starting.length() != 6) return failure("Starting word must contain exactly six letters");
        if (key == null || key.length() < 3 || key.length() > 6) return failure("Key word must contain three to six letters");
        boolean reversed = "AEIOU".indexOf(starting.charAt(0)) >= 0;
        if (reversed) key = new StringBuilder(key).reverse().toString();
        boolean transposed = "AEIOU".indexOf(starting.charAt(5)) >= 0;
        StringBuilder answer = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            int start = starting.charAt(i) - 'A', keyword = key.charAt(i % key.length()) - 'A';
            answer.append(transposed ? TABLE[start].charAt(keyword) : TABLE[keyword].charAt(start));
        }
        return success(new CrypticPasswordOutput(answer.toString(), key, reversed, transposed));
    }

    private static String letters(String value) {
        if (value == null) return null;
        String normalized = value.trim().toUpperCase();
        return normalized.matches("[A-Z]+") ? normalized : null;
    }
}
