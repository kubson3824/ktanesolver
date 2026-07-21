package ktanesolver.module.modded.regular.flags;

public enum FlagsCountry {
	ALGERIA("Algeria", "North Africa", "Algiers", "DZD", "DZA", 213),
	AUSTRALIA("Australia", "Oceania", "Canberra", "AUD", "AUS", 61),
	AUSTRIA("Austria", "Europe", "Vienna", "EUR", "AUT", 43),
	BELGIUM("Belgium", "Europe", "Brussels", "EUR", "BEL", 32),
	BRAZIL("Brazil", "South America", "Brasília", "BRL", "BRA", 55),
	CANADA("Canada", "North America", "Ottawa", "CAD", "CAN", 1),
	CHILE("Chile", "South America", "Santiago", "CLP", "CHL", 56),
	CHINA("China", "East Asia", "Beijing", "CNY", "CHN", 86),
	COLOMBIA("Colombia", "South America", "Bogotá", "COP", "COL", 57),
	CUBA("Cuba", "North America", "Havana", "CUP", "CUB", 53),
	CZECH_REPUBLIC("Czech Republic", "Europe", "Prague", "CZK", "CZE", 420),
	DENMARK("Denmark", "Europe", "Copenhagen", "DKK", "DNK", 45),
	FINLAND("Finland", "Europe", "Helsinki", "EUR", "FIN", 358),
	FRANCE("France", "Europe", "Paris", "EUR", "FRA", 33),
	GERMANY("Germany", "Europe", "Berlin", "EUR", "DEU", 49),
	GREENLAND("Greenland", "North America", "Nuuk", "DKK", "GRL", 299),
	ICELAND("Iceland", "Europe", "Reykjavík", "ISK", "ISL", 354),
	INDIA("India", "South Asia", "New Delhi", "INR", "IND", 91),
	JAPAN("Japan", "East Asia", "Tokyo", "JPY", "JPN", 81),
	MEXICO("Mexico", "North America", "Mexico City", "MXN", "MEX", 52),
	MOROCCO("Morocco", "North Africa", "Rabat", "MAD", "MAR", 212),
	NETHERLANDS("Netherlands", "Europe", "Amsterdam", "EUR", "NLD", 31),
	NEW_ZEALAND("New Zealand", "Oceania", "Wellington", "NZD", "NZL", 64),
	NORWAY("Norway", "Europe", "Oslo", "NOK", "NOR", 47),
	PANAMA("Panama", "Central America", "Panama City", "PAB", "PAN", 507),
	PERU("Peru", "South America", "Lima", "PEN", "PER", 51),
	POLAND("Poland", "Europe", "Warsaw", "PLN", "POL", 48),
	SAMOA("Samoa", "Oceania", "Apia", "WST", "WSM", 685),
	SENEGAL("Senegal", "West Africa", "Dakar", "XOF", "SEN", 221),
	SOUTH_KOREA("South Korea", "East Asia", "Seoul", "KRW", "KOR", 82),
	SPAIN("Spain", "Europe", "Madrid", "EUR", "ESP", 34),
	SUDAN("Sudan", "North Africa", "Khartoum", "SDG", "SDN", 249),
	SWEDEN("Sweden", "Europe", "Stockholm", "SEK", "SWE", 46),
	THAILAND("Thailand", "Southeast Asia", "Bangkok", "THB", "THA", 66),
	UNITED_KINGDOM("United Kingdom", "Europe", "London", "GBP", "GBR", 44),
	UNITED_STATES("United States", "North America", "Washington, D.C.", "USD", "USA", 1);

	private final String displayName;
	private final String continent;
	private final String capital;
	private final String currency;
	private final String isoCode;
	private final int dialCode;

	FlagsCountry(String displayName, String continent, String capital, String currency, String isoCode, int dialCode) {
		this.displayName = displayName;
		this.continent = continent;
		this.capital = capital;
		this.currency = currency;
		this.isoCode = isoCode;
		this.dialCode = dialCode;
	}

	public String displayName() {
		return displayName;
	}

	public String continent() {
		return continent;
	}

	public String capital() {
		return capital;
	}

	public String currency() {
		return currency;
	}

	public String isoCode() {
		return isoCode;
	}

	public int dialCode() {
		return dialCode;
	}
}
