
package ktanesolver.module.modded.regular.foreignexchange;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo (type = ModuleType.FOREIGN_EXCHANGE_RATES, id = "foreignexchange", name = "Foreign Exchange Rates", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Look up the live exchange rate between two currencies and convert the stated amount", tags = {
	"currency", "exchange", "rates", "calculation"})
public class ForeignExchangeSolver extends AbstractModuleSolver<ForeignExchangeInput, ForeignExchangeOutput> {

	private static final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

	private static final ObjectMapper objectMapper = new ObjectMapper();
	private static final Map<String, String> CURRENCIES_BY_NUMBER = Map.ofEntries(
		Map.entry("036", "AUD"), Map.entry("975", "BGN"), Map.entry("986", "BRL"),
		Map.entry("124", "CAD"), Map.entry("756", "CHF"), Map.entry("156", "CNY"),
		Map.entry("208", "DKK"), Map.entry("978", "EUR"), Map.entry("826", "GBP"),
		Map.entry("344", "HKD"), Map.entry("191", "HRK"), Map.entry("348", "HUF"),
		Map.entry("360", "IDR"), Map.entry("376", "ILS"), Map.entry("356", "INR"),
		Map.entry("392", "JPY"), Map.entry("410", "KRW"), Map.entry("484", "MXN"),
		Map.entry("458", "MYR"), Map.entry("578", "NOK"), Map.entry("554", "NZD"),
		Map.entry("608", "PHP"), Map.entry("985", "PLN"), Map.entry("946", "RON"),
		Map.entry("643", "RUB"), Map.entry("752", "SEK"), Map.entry("702", "SGD"),
		Map.entry("764", "THB"), Map.entry("949", "TRY"), Map.entry("840", "USD"),
		Map.entry("710", "ZAR")
	);

	@Override
	public SolveResult<ForeignExchangeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ForeignExchangeInput input) {
		String baseCurrency = input.baseCurrency();
		String targetCurrency = input.targetCurrency();
		String amountStr = input.amount();
		boolean hasGreenLights = input.hasGreenLights();
		int batteryCount = bomb.getAaBatteryCount() + bomb.getDBatteryCount();

		// Validate input
		if(baseCurrency == null || targetCurrency == null || amountStr == null) {
			ForeignExchangeOutput output = new ForeignExchangeOutput(0);
			return success(output, false);
		}

		// Store module state
		storeState(module, "baseCurrency", baseCurrency);
		storeState(module, "targetCurrency", targetCurrency);
		storeState(module, "amount", amountStr);
		storeState(module, "hasGreenLights", hasGreenLights);

		try {
			int amount = Integer.parseInt(amountStr);
			baseCurrency = baseCurrency.trim().toUpperCase(Locale.ROOT);
			targetCurrency = targetCurrency.trim().toUpperCase(Locale.ROOT);

			// The displayed top and middle rows swap base/target roles when the bomb has multiple batteries.
			if(batteryCount > 1) {
				String temp = baseCurrency;
				baseCurrency = targetCurrency;
				targetCurrency = temp;
			}

			if(hasGreenLights) {
				// Green lights: query exchange rate API
				return solveWithGreenLights(toAlphabeticCode(baseCurrency), toAlphabeticCode(targetCurrency), amount);
			}
			else {
				// Red lights: use numeric code of target currency
				return solveWithRedLights(targetCurrency);
			}
		}
		catch(IllegalArgumentException e) {
			ForeignExchangeOutput output = new ForeignExchangeOutput(0);
			return success(output, false);
		}
	}

	private SolveResult<ForeignExchangeOutput> solveWithGreenLights(String baseCurrency, String targetCurrency, int amount) {
		try {
			// Query the exchange rate API
			String url = String.format("https://fer.eltrick.uk/latest?base=%s&symbols=%s", baseCurrency, targetCurrency);

			HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).timeout(Duration.ofSeconds(10)).build();

			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

			if(response.statusCode() != 200) {
				ForeignExchangeOutput output = new ForeignExchangeOutput(0);
				return success(output, false);
			}

			// Parse the JSON response
			JsonNode root = objectMapper.readTree(response.body());
			JsonNode ratesNode = root.get("rates");

			if(ratesNode == null || !ratesNode.has(targetCurrency)) {
				ForeignExchangeOutput output = new ForeignExchangeOutput(0);
				return success(output, false);
			}

			double exchangeRate = ratesNode.get(targetCurrency).asDouble();
			double convertedAmount = amount * exchangeRate;

			// Round down and get 2nd digit from left
			long roundedDown = (long)Math.floor(convertedAmount);
			int keyPosition = getSecondDigitFromLeft(roundedDown);

			ForeignExchangeOutput output = new ForeignExchangeOutput(keyPosition);
			return success(output);

		}
		catch(java.io.IOException | InterruptedException e) {
			ForeignExchangeOutput output = new ForeignExchangeOutput(0);
			return success(output, false);
		}
		catch(Exception e) {
			ForeignExchangeOutput output = new ForeignExchangeOutput(0);
			return success(output, false);
		}
	}

	private SolveResult<ForeignExchangeOutput> solveWithRedLights(String targetCurrency) {
		try {
			int numericCode = getCurrencyNumericCode(targetCurrency);

			// Get 2nd digit from right
			int keyPosition = getSecondDigitFromRight(numericCode);

			ForeignExchangeOutput output = new ForeignExchangeOutput(keyPosition);
			return success(output);

		}
		catch(Exception e) {
			ForeignExchangeOutput output = new ForeignExchangeOutput(0);
			return success(output, false);
		}
	}

	private int getSecondDigitFromLeft(long number) {
		if(number < 10) {
			return 0;
		}

		String numStr = Long.toString(number);
		if(numStr.length() >= 2) {
			return Character.getNumericValue(numStr.charAt(1));
		}
		return 0;
	}

	private int getSecondDigitFromRight(int number) {
		String numStr = Integer.toString(number);
		if(numStr.length() >= 2) {
			return Character.getNumericValue(numStr.charAt(numStr.length() - 2));
		}
		return 0;
	}

	private String toAlphabeticCode(String currencyCode) {
		if(currencyCode.matches("[A-Z]{3}")) {
			return currencyCode;
		}
		String alphabeticCode = CURRENCIES_BY_NUMBER.get(currencyCode);
		if(alphabeticCode == null) {
			throw new IllegalArgumentException("Unknown currency code: " + currencyCode);
		}
		return alphabeticCode;
	}

	private int getCurrencyNumericCode(String currencyCode) {
		if(CURRENCIES_BY_NUMBER.containsKey(currencyCode)) {
			return Integer.parseInt(currencyCode);
		}
		return CURRENCIES_BY_NUMBER.entrySet().stream()
			.filter(entry -> entry.getValue().equals(currencyCode))
			.findFirst()
			.map(entry -> Integer.parseInt(entry.getKey()))
			.orElseThrow(() -> new IllegalArgumentException("Unknown currency code: " + currencyCode));
	}

}
