import { StyleSheet } from "react-native";
import { COLORS } from "../themes/colors";
import { SPACING } from "./spacing";

export const globalStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.gray800,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.md,
    padding: SPACING.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: SPACING.md,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: COLORS.gray300,
  },
});
