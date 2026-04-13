package ktanesolver.module.modded.regular.laundry;

public enum LaundryColor {
    RUBY_FOUNTAIN("Ruby Fountain", LaundrySymbol.HIGH_HEAT, LaundrySymbol.ANY_SOLVENT),
    STAR_LEMON_QUARTZ("Star Lemon Quartz", LaundrySymbol.DRY_FLAT, LaundrySymbol.LOW_HEAT),
    SAPPHIRE_SPRINGS("Sapphire Springs", LaundrySymbol.TUMBLE_DRY, LaundrySymbol.SHORT_CYCLE),
    JADE_CLUSTER("Jade Cluster", LaundrySymbol.DO_NOT_TUMBLE_DRY, LaundrySymbol.NO_STEAM_FINISHING),
    CLOUDED_PEARL("Clouded Pearl", LaundrySymbol.LOW_HEAT_DRY, LaundrySymbol.LOW_HEAT),
    MALINITE("Malinite", LaundrySymbol.MEDIUM_HEAT, LaundrySymbol.NON_CHLORINE_BLEACH);

    private final String label;
    private final LaundrySymbol dryingSymbol;
    private final LaundrySymbol specialSymbol;

    LaundryColor(String label, LaundrySymbol dryingSymbol, LaundrySymbol specialSymbol) {
        this.label = label;
        this.dryingSymbol = dryingSymbol;
        this.specialSymbol = specialSymbol;
    }

    public String label() {
        return label;
    }

    public LaundrySymbol dryingSymbol() {
        return dryingSymbol;
    }

    public LaundrySymbol specialSymbol() {
        return specialSymbol;
    }
}
