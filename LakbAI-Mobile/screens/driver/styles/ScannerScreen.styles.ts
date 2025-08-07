import { StyleSheet } from 'react-native';
import { COLORS } from '../../../shared/themes/colors';
import { SPACING } from '../../../shared/styles/spacing';

export const scannerStyles = StyleSheet.create({
  scannerHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  scannerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  cameraViewfinder: {
    backgroundColor: '#F3F4F6',
    height: 256,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    marginBottom: 24,
  },
  viewfinderText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
  },
  viewfinderSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  locationCard: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 24,
  },
  currentLocation: {
    fontSize: 18,
    fontWeight: '500',
    color: '#15803D',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#15803D',
    marginBottom: 2,
  },
  locationNote: {
    fontSize: 12,
    color: '#15803D',
  },
  instructionsCard: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 4,
  },
  warningCard: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 24,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
  },
});