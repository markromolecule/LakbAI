import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../../shared/styles';

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  scannerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray800,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  scannerSubtitle: {
    color: COLORS.gray500,
    textAlign: 'center',
    fontSize: 16,
  },
  cameraPlaceholder: {
    backgroundColor: COLORS.gray100,
    height: 200,
    borderRadius: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray300,
    borderStyle: 'dashed',
    marginBottom: SPACING.xl,
  },
  cameraText: {
    color: COLORS.gray400,
    marginTop: SPACING.sm,
  },
  scanButton: {
    marginBottom: SPACING.lg,
  },
  simulateButton: {
    backgroundColor: COLORS.gray600,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
    overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  // Test button styles
  testButtonsContainer: {
    backgroundColor: COLORS.gray50,
    borderRadius: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  testSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  testButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.sm,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.sm,
    minWidth: 120,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  testNote: {
    fontSize: 12,
    color: COLORS.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Additional Information Section
  additionalInfoContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.md,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  additionalInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray800,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: SPACING.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  infoItemText: {
    fontSize: 14,
    color: COLORS.gray700,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  tipsSection: {
    backgroundColor: COLORS.gray50,
    borderRadius: SPACING.sm,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: SPACING.sm,
  },
  tipsText: {
    fontSize: 14,
    color: COLORS.gray600,
    lineHeight: 20,
  },
});

export default styles;