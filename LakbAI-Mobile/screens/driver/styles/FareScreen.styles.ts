import { StyleSheet } from 'react-native';
import { COLORS } from '../../../shared/themes/colors';
import { SPACING } from '../../../shared/styles/spacing';

export const fareStyles = StyleSheet.create({
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  fareCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fareHeader: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  fareSubtitle: {
    fontSize: 14,
    color: '#16A34A',
    marginTop: 4,
  },
  fareList: {
    padding: 16,
  },
  fareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fareFrom: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  fareTo: {
    fontSize: 14,
    color: '#6B7280',
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 4,
  },
  tipsCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#15803D',
    marginBottom: 4,
  },
});