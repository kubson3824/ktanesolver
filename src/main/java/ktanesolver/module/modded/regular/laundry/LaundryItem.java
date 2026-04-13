package ktanesolver.module.modded.regular.laundry;

public enum LaundryItem {
    CORSET("Corset", LaundrySymbol.IRON_150C_300F, LaundrySymbol.BLEACH),
    SHIRT("Shirt", LaundrySymbol.NO_STEAM, LaundrySymbol.NO_TETRACHLORETHYLENE),
    SKIRT("Skirt", LaundrySymbol.IRON, LaundrySymbol.REDUCED_MOISTURE),
    SKORT("Skort", LaundrySymbol.IRON_200C_390F, LaundrySymbol.CIRCLE_TOP_LEFT),
    SHORTS("Shorts", LaundrySymbol.IRON_150C_300F, LaundrySymbol.DO_NOT_BLEACH),
    SCARF("Scarf", LaundrySymbol.IRON_110C_230F, LaundrySymbol.DO_NOT_DRYCLEAN);

    private final String label;
    private final LaundrySymbol ironingSymbol;
    private final LaundrySymbol specialSymbol;

    LaundryItem(String label, LaundrySymbol ironingSymbol, LaundrySymbol specialSymbol) {
        this.label = label;
        this.ironingSymbol = ironingSymbol;
        this.specialSymbol = specialSymbol;
    }

    public String label() {
        return label;
    }

    public LaundrySymbol ironingSymbol() {
        return ironingSymbol;
    }

    public LaundrySymbol specialSymbol() {
        return specialSymbol;
    }
}
