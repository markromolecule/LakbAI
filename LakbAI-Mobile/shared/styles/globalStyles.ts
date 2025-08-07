import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../themes/colors";
import { SPACING } from "./spacing";
import { theme } from "../themes";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const globalStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    minHeight: screenHeight,
  },
  container: {
    flex: 1,
    paddingHorizontal: screenWidth > 768 ? SPACING.xl : SPACING.lg,
    paddingVertical: screenWidth > 768 ? SPACING.lg : SPACING.md,
    backgroundColor: COLORS.white,
    minHeight: '100%',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.white,
    minHeight: screenHeight,
    width: '100%',
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
