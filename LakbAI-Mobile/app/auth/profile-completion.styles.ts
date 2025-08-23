import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Header styles
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    backgroundColor: '#F8F9FA',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Form styles
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  sectionContainer: {
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  // Input styles
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  inputContainer: {
    flex: 1,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },

  textInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },

  // Button styles
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 16,
  },

  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    minHeight: 56,
  },

  secondaryButtonText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  // Responsive adjustments
  '@media (max-width: 375)': {
    formContainer: {
      paddingHorizontal: 20,
    },
    
    buttonContainer: {
      paddingHorizontal: 20,
    },
    
    header: {
      paddingHorizontal: 20,
    },
    
    title: {
      fontSize: 24,
    },
  },
});
