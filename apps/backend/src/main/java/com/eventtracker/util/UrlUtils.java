package com.eventtracker.util;

public class UrlUtils {
    public static String normalizeUrl(String url) {
        if (url == null || url.isBlank()) return null;
        
        String trimmed = url.trim();
        int doubleSlashIndex = trimmed.indexOf("://");
        int pathStartIndex;
        if (doubleSlashIndex != -1) {
            pathStartIndex = trimmed.indexOf('/', doubleSlashIndex + 3);
        } else {
            pathStartIndex = trimmed.indexOf('/');
        }
        
        String protocolAndDomain;
        String pathAndQuery;
        
        if (pathStartIndex != -1) {
            protocolAndDomain = trimmed.substring(0, pathStartIndex).toLowerCase();
            pathAndQuery = trimmed.substring(pathStartIndex);
        } else {
            protocolAndDomain = trimmed.toLowerCase();
            pathAndQuery = "";
        }
        
        int queryIndex = pathAndQuery.indexOf('?');
        if (queryIndex != -1) {
            pathAndQuery = pathAndQuery.substring(0, queryIndex);
        }
        
        if (pathAndQuery.endsWith("/") && pathAndQuery.length() > 1) {
            pathAndQuery = pathAndQuery.substring(0, pathAndQuery.length() - 1);
        } else if (pathAndQuery.equals("/")) {
            pathAndQuery = "";
        }
        
        return protocolAndDomain + pathAndQuery;
    }
}
