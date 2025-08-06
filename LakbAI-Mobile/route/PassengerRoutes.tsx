// LakbAI-Mobile/route/PassengerRoutes.ts
import { Href } from "expo-router";

export enum PassengerRoutes {
  HOME = "/passenger/home",
  SCANNER = "/passenger/scanner",
  CHAT = "/passenger/chat",
  FARE = "/passenger/fare",
  ROUTE = "/passenger/route"
}

export type PassengerRouteHref = `${PassengerRoutes}` & Href;