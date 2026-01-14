package ktanesolver.module.modded.regular.foreignexchange;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
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
@ModuleInfo(
        type = ModuleType.FOREIGN_EXCHANGE_RATES,
        id = "foreignexchange",
        name = "Foreign Exchange Rates",
        category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
        description = "Look up the live exchange rate between two currencies and convert the stated amount",
        tags = {"currency", "exchange", "rates", "calculation"}
)
public class ForeignExchangeSolver extends AbstractModuleSolver<ForeignExchangeInput, ForeignExchangeOutput> {

    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public SolveResult<ForeignExchangeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ForeignExchangeInput input) {
        String baseCurrency = input.baseCurrency();
        String targetCurrency = input.targetCurrency();
        String amountStr = input.amount();
        boolean hasGreenLights = input.hasGreenLights();
        int batteryCount = bomb.getAaBatteryCount() + bomb.getDBatteryCount();
        
        // Validate input
        if (baseCurrency == null || targetCurrency == null || amountStr == null) {
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
            
            if (hasGreenLights) {
                // Green lights: query exchange rate API
                return solveWithGreenLights(baseCurrency, targetCurrency, amount, batteryCount);
            } else {
                // Red lights: use numeric code of target currency
                return solveWithRedLights(targetCurrency);
            }
        } catch (NumberFormatException e) {
            ForeignExchangeOutput output = new ForeignExchangeOutput(0);
            return success(output, false);
        }
    }
    
    private SolveResult<ForeignExchangeOutput> solveWithGreenLights(String baseCurrency, String targetCurrency, 
            int amount, int batteryCount) {
        try {
            // If more than one battery, swap base and target
            if (batteryCount > 1) {
                String temp = baseCurrency;
                baseCurrency = targetCurrency;
                targetCurrency = temp;
            }
            
            // Query the exchange rate API
            String url = String.format("https://fer.eltrick.uk/latest?base=%s&symbols=%s", 
                    baseCurrency, targetCurrency);
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, 
                    HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() != 200) {
                ForeignExchangeOutput output = new ForeignExchangeOutput(0);
                return success(output, false);
            }
            
            // Parse the JSON response
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode ratesNode = root.get("rates");
            
            if (ratesNode == null || !ratesNode.has(targetCurrency)) {
                ForeignExchangeOutput output = new ForeignExchangeOutput(0);
                return success(output, false);
            }
            
            double exchangeRate = ratesNode.get(targetCurrency).asDouble();
            double convertedAmount = amount * exchangeRate;
            
            // Round down and get 2nd digit from left
            long roundedDown = (long) Math.floor(convertedAmount);
            int keyPosition = getSecondDigitFromLeft(roundedDown);
            
            ForeignExchangeOutput output = new ForeignExchangeOutput(keyPosition);
            return success(output);
            
        } catch (IOException | InterruptedException e) {
            ForeignExchangeOutput output = new ForeignExchangeOutput(0);
            return success(output, false);
        } catch (Exception e) {
            ForeignExchangeOutput output = new ForeignExchangeOutput(0);
            return success(output, false);
        }
    }
    
    private SolveResult<ForeignExchangeOutput> solveWithRedLights(String targetCurrency) {
        try {
            // Get ISO 4217 numeric code for target currency from API
            int numericCode = getCurrencyNumericCodeFromAPI(targetCurrency);
            
            // Get 2nd digit from right
            int keyPosition = getSecondDigitFromRight(numericCode);
            
            ForeignExchangeOutput output = new ForeignExchangeOutput(keyPosition);
            return success(output);
            
        } catch (Exception e) {
            ForeignExchangeOutput output = new ForeignExchangeOutput(0);
            return success(output, false);
        }
    }
    
    private int getSecondDigitFromLeft(long number) {
        if (number < 10) {
            return 0;
        }
        
        String numStr = Long.toString(number);
        if (numStr.length() >= 2) {
            return Character.getNumericValue(numStr.charAt(1));
        }
        return 0;
    }
    
    private int getSecondDigitFromRight(int number) {
        String numStr = Integer.toString(number);
        if (numStr.length() >= 2) {
            return Character.getNumericValue(numStr.charAt(numStr.length() - 2));
        }
        return 0;
    }
    
    private int getCurrencyNumericCodeFromAPI(String currencyCode) throws IOException, InterruptedException {
        // Fetch the CSV file with currency codes
        String csvUrl = "https://datahub.io/core/currency-codes/_r/-/data/codes-all.csv";
        
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(csvUrl))
                .timeout(Duration.ofSeconds(10))
                .build();
        
        HttpResponse<String> response = httpClient.send(request, 
                HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() != 200) {
            throw new IOException("Failed to fetch currency codes: HTTP " + response.statusCode());
        }
        
        // Parse CSV to find the numeric code
        String[] lines = response.body().split("\n");
        for (int i = 1; i < lines.length; i++) { // Skip header
            String[] parts = lines[i].split(",");
            if (parts.length >= 4) {
                String alphabeticCode = parts[2].trim();
                if (alphabeticCode.equals(currencyCode.toUpperCase())) {
                    String numericCodeStr = parts[3].trim();
                    if (!numericCodeStr.isEmpty()) {
                        return Integer.parseInt(numericCodeStr);
                    }
                }
            }
        }
        
        // If not found, return default code
        return 999;
    }

}
