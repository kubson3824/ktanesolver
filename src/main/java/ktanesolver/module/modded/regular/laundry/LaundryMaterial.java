package ktanesolver.module.modded.regular.laundry;

public enum LaundryMaterial {
    POLYESTER("Polyester", LaundrySymbol.WASH_120F, LaundrySymbol.PETROLEUM_SOLVENT_ONLY),
    COTTON("Cotton", LaundrySymbol.WASH_95F_DOTS, LaundrySymbol.DO_NOT_DRYCLEAN),
    WOOL("Wool", LaundrySymbol.HAND_WASH, LaundrySymbol.REDUCED_MOISTURE),
    NYLON("Nylon", LaundrySymbol.WASH_80F, LaundrySymbol.LOW_HEAT),
    CORDUROY("Corduroy", LaundrySymbol.WASH_105F, LaundrySymbol.WET_CLEANING),
    LEATHER("Leather", LaundrySymbol.DO_NOT_WASH, LaundrySymbol.NO_TETRACHLORETHYLENE);

    private final String label;
    private final LaundrySymbol washingSymbol;
    private final LaundrySymbol specialSymbol;

    LaundryMaterial(String label, LaundrySymbol washingSymbol, LaundrySymbol specialSymbol) {
        this.label = label;
        this.washingSymbol = washingSymbol;
        this.specialSymbol = specialSymbol;
    }

    public String label() {
        return label;
    }

    public LaundrySymbol washingSymbol() {
        return washingSymbol;
    }

    public LaundrySymbol specialSymbol() {
        return specialSymbol;
    }
}
