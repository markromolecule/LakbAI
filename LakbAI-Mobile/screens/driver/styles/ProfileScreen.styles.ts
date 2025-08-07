import { StyleSheet } from 'react-native';
import { COLORS } from '../../../shared/themes/colors';
import { SPACING } from '../../../shared/styles/spacing';

export const profileStyles = StyleSheet.create({
  profileCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#3B82F6',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 4,
  },
  totalTrips: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  profileDetails: {
    flexDirection: 'row',
    gap: 24,
  },
  profileSection: {
    flex: 1,
  },
  profileSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  profileValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  contactsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  remindersCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  remindersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  reminderItem: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 4,
  },
});