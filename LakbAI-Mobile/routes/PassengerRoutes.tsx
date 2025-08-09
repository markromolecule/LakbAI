import { Href } from "expo-router";

export enum PassengerRoutes {
  HOME = "/passenger/home",
  SCANNER = "/passenger/scanner",
  CHAT = "/passenger/chat",
  FARE = "/passenger/fare",
  ROUTE = "/passenger/route",
  PROFILE = "/passenger/profile"
}

// Extracts enum values ("/passenger/...")
export type PassengerRouteValues = `${PassengerRoutes}`;

// Makes sure it's a valid Expo Router href
export type PassengerRouteHref = PassengerRouteValues;