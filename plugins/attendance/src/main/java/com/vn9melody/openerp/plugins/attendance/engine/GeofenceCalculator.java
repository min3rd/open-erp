package com.vn9melody.openerp.plugins.attendance.engine;

/**
 * Pure Haversine distance calculator for Mobile GPS geofencing (ADR-S09-005 §2.1).
 */
public final class GeofenceCalculator {

    private static final double EARTH_RADIUS_METERS = 6371000.0;

    private GeofenceCalculator() {}

    /**
     * Calculates the great-circle distance between two GPS coordinates in meters.
     */
    public static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }

    /**
     * Checks whether the user's GPS coordinate is within the branch radius.
     */
    public static boolean isWithinRadius(double userLat, double userLon,
                                         double branchLat, double branchLon,
                                         double radiusMeters) {
        if (radiusMeters <= 0) {
            return true;
        }
        return distanceMeters(userLat, userLon, branchLat, branchLon) <= radiusMeters;
    }
}

