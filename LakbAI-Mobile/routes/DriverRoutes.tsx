import { Href } from "expo-router";

export enum DriverRoutes {
  HOME = "/driver",
  SCANNER = "/driver/scanner",
  FARE = "/driver/fare", 
  PROFILE = "/driver/profile",
  LOGS = "/driver/logs"
}

// Extracts enum values ("/driver/...")
export type DriverRouteValues = `${DriverRoutes}`;

// Makes sure it's a valid Expo Router href
export type DriverRouteHref = DriverRouteValues;