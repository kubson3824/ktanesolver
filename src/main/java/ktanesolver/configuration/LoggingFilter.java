package ktanesolver.configuration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.io.UnsupportedEncodingException;

@Slf4j
@Component
public class LoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();
        
        try {
            filterChain.doFilter(requestWrapper, responseWrapper);
        } finally {
            long timeTaken = System.currentTimeMillis() - startTime;
            
            String requestBody = getStringValue(requestWrapper.getContentAsByteArray(),
                    request.getCharacterEncoding());
            String responseBody = getStringValue(responseWrapper.getContentAsByteArray(),
                    response.getCharacterEncoding());

            log.info(
                    "\n" +
                    "=== REQUEST ===\n" +
                    "METHOD: {} | URI: {} | QUERY: {}\n" +
                    "HEADERS: {}\n" +
                    "REQUEST BODY: {}\n" +
                    "=== RESPONSE ===\n" +
                    "STATUS: {} | TIME: {}ms\n" +
                    "RESPONSE BODY: {}",
                    request.getMethod(),
                    request.getRequestURI(),
                    request.getQueryString() == null ? "" : request.getQueryString(),
                    getRequestHeaders(request),
                    requestBody,
                    response.getStatus(),
                    timeTaken,
                    responseBody
            );

            responseWrapper.copyBodyToResponse();
        }
    }

    private String getStringValue(byte[] contentAsByteArray, String characterEncoding) {
        try {
            return new String(contentAsByteArray, 0, contentAsByteArray.length, characterEncoding);
        } catch (UnsupportedEncodingException e) {
            log.error("Error reading request/response body", e);
        }
        return "";
    }

    private String getRequestHeaders(HttpServletRequest request) {
        StringBuilder headers = new StringBuilder();
        request.getHeaderNames().asIterator()
                .forEachRemaining(headerName -> 
                    headers.append(headerName).append(": ").append(request.getHeader(headerName)).append(", ")
                );
        return headers.toString();
    }
}
