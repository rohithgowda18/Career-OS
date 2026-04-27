package com.eventtracker.util;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

public class URLValidationUtil {
    private static final List<Pattern> BLOCKED_PATTERNS = Arrays.asList(
        Pattern.compile("^localhost$", Pattern.CASE_INSENSITIVE),
        Pattern.compile("^127\\."),
        Pattern.compile("^192\\.168\\."),
        Pattern.compile("^10\\."),
        Pattern.compile("^172\\.(1[6-9]|2[0-9]|3[01])\\."),
        Pattern.compile("^169\\.254\\."),
        Pattern.compile("^0\\.0\\.0\\.0$"),
        Pattern.compile("^\\[::\\]$"),
        Pattern.compile("^::1$")
    );

    public static boolean isValidURL(String urlString) {
        if (urlString == null || urlString.isBlank()) {
            return false;
        }

        try {
            URI uri = new URI(urlString);
            String scheme = uri.getScheme();
            
            // Only allow http and https
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                return false;
            }

            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                return false;
            }

            // Check for blocked patterns (SSRF protection)
            for (Pattern pattern : BLOCKED_PATTERNS) {
                if (pattern.matcher(host).find()) {
                    return false;
                }
            }

            return true;
        } catch (URISyntaxException e) {
            return false;
        }
    }

    public static String sanitizeURLForLogging(String urlString) {
        try {
            URI uri = new URI(urlString);
            return uri.getScheme() + "://" + uri.getHost() + uri.getPath();
        } catch (Exception e) {
            return "invalid-url";
        }
    }
}
