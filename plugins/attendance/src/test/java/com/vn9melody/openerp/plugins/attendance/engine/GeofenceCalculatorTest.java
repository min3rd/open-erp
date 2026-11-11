package com.vn9melody.openerp.plugins.attendance.engine;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GeofenceCalculatorTest {

    // Bitexco Financial Tower, HCMC (10.7716, 106.7044)
    private static final double BITEXCO_LAT = 10.7716;
    private static final double BITEXCO_LON = 106.7044;

    // Landmark 81, HCMC (10.7950, 106.7219) - approx 3.2 km from Bitexco
    private static final double LANDMARK81_LAT = 10.7950;
    private static final double LANDMARK81_LON = 106.7219;

    @Test
    @DisplayName("Same point distance is zero")
    void samePointDistanceIsZero() {
        double dist = GeofenceCalculator.distanceMeters(BITEXCO_LAT, BITEXCO_LON, BITEXCO_LAT, BITEXCO_LON);
        assertEquals(0.0, dist, 0.001);
    }

    @Test
    @DisplayName("Distance between known landmarks in HCMC is around 3.2km")
    void distanceBetweenLandmarks() {
        double dist = GeofenceCalculator.distanceMeters(BITEXCO_LAT, BITEXCO_LON, LANDMARK81_LAT, LANDMARK81_LON);
        assertTrue(dist > 3000 && dist < 3500, "Distance should be ~3.2km, was: " + dist);
    }

    @Test
    @DisplayName("User within 200m radius is accepted")
    void userWithinRadius() {
        // Point ~100m away from Bitexco (0.0009 deg lat ~ 100m)
        double nearLat = BITEXCO_LAT + 0.0008;
        double nearLon = BITEXCO_LON;

        double dist = GeofenceCalculator.distanceMeters(BITEXCO_LAT, BITEXCO_LON, nearLat, nearLon);
        assertTrue(dist < 150, "Distance should be < 150m, was: " + dist);

        assertTrue(GeofenceCalculator.isWithinRadius(nearLat, nearLon, BITEXCO_LAT, BITEXCO_LON, 200));
    }

    @Test
    @DisplayName("User outside 200m radius is flagged")
    void userOutsideRadius() {
        // Landmark 81 is 3.2km away, definitely outside 200m
        assertFalse(GeofenceCalculator.isWithinRadius(LANDMARK81_LAT, LANDMARK81_LON, BITEXCO_LAT, BITEXCO_LON, 200));
    }

    @Test
    @DisplayName("Zero or negative radius allows check-in without restriction")
    void zeroRadiusAllowsAll() {
        assertTrue(GeofenceCalculator.isWithinRadius(LANDMARK81_LAT, LANDMARK81_LON, BITEXCO_LAT, BITEXCO_LON, 0));
        assertTrue(GeofenceCalculator.isWithinRadius(LANDMARK81_LAT, LANDMARK81_LON, BITEXCO_LAT, BITEXCO_LON, -10));
    }
}

