import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../../../shared/themes/colors";
import { SPACING } from "../../../shared/styles/spacing";

const { width: screenWidth } = Dimensions.get("window");

// Responsive helpers for 2x2 grid
const getResponsiveSpacing = () => {
  if (screenWidth > 768) return SPACING.lg;
  return SPACING.md;
};

const getResponsiveGap = () => {
  if (screenWidth > 768) return SPACING.lg;
  if (screenWidth > 480) return SPACING.md;
  return SPACING.sm;
};

export const homeStyles = StyleSheet.create({
  headerCard: {
    backgroundColor: COLORS.driverPrimary,
    borderRadius: 12,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.primaryLight,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  jeepneyLabel: {
    fontSize: 14,
    color: "#BBF7D0",
  },
  jeepneyNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  // Status indicator styles
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  statsGrid: {
    flexDirection: "row",
    gap: screenWidth > 768 ? SPACING.lg : SPACING.md,
    marginBottom: screenWidth > 768 ? SPACING.xl : SPACING.lg,
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: screenWidth > 768 ? 200 : 150,
    backgroundColor: COLORS.white,
    padding: screenWidth > 768 ? SPACING.xl : SPACING.lg,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: screenWidth > 768 ? SPACING.lg : SPACING.md,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: getResponsiveGap(),
    marginBottom: getResponsiveSpacing(),
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: screenWidth > 768 ? SPACING.lg : SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    borderWidth: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCardWrapper: {
    width: "48%",
    minWidth: screenWidth > 768 ? 200 : 160,
    aspectRatio: 1.5,
  },
  actionTitle: {
    fontSize: screenWidth > 768 ? 16 : 14,
    fontWeight: "600",
    color: COLORS.gray800,
    marginTop: SPACING.sm,
    textAlign: "center",
    lineHeight: screenWidth > 768 ? 20 : 18,
  },
  actionSubtitle: {
    fontSize: screenWidth > 768 ? 14 : 12,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
    textAlign: "center",
    lineHeight: screenWidth > 768 ? 18 : 16,
  },
  // Duty button styles
  statusCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginTop: SPACING.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 8,
    flex: 1,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
  },
  statusInfo: {
    gap: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  dutyButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  dutyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
