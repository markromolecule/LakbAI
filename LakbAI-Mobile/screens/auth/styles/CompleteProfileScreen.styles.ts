import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Compensate for back button width
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  formSection: {
    marginBottom: 35,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 25,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000', // Changed from #333333 to #000000 for better visibility
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#000000', // Changed from #333333 to #000000 for better visibility
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#000000', // Changed from #333333 to #000000 for better visibility
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  birthdayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  datePickerGroup: {
    flex: 1,
    minWidth: 0, // Prevent overflow
  },
  datePickerLabel: {
    fontSize: 13,
    color: '#000000', // Changed from #666666 to #000000 for better visibility
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  genderButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 15,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  genderButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 15,
    color: '#000000', // Changed from #333333 to #000000 for better visibility
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  genderButtonTextSelected: {
    color: '#FFFFFF',
  },
  userTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 25,
    borderWidth: 1.5,
    borderColor: '#B3D9F2',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userTypeInfoText: {
    fontSize: 15,
    color: '#007AFF',
    marginLeft: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginVertical: 35,
    marginHorizontal: 10,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 17,
    color: '#666666',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  dropdownList: {
    maxHeight: 300, // Limit height for scrolling
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemSelected: {
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000000', // Changed from #333333 to #000000 for better visibility
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dropdownItemTextSelected: {
    color: '#007AFF',
  },
});

export default styles;