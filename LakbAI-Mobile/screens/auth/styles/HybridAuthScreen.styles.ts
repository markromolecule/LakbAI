import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Loading styles
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
    marginTop: 16,
  },

  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },

  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 15,
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

  // Method selection styles
  methodContainer: {
    flex: 1,
    gap: 20,
    marginBottom: 32,
  },

  methodButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  methodIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  methodIconText: {
    fontSize: 24,
  },

  methodContent: {
    flex: 1,
    marginLeft: 16,
  },

  methodTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },

  methodDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    marginBottom: 16,
  },

  methodFeatures: {
    gap: 4,
  },

  featureText: {
    fontSize: 12,
    color: '#007AFF',
    lineHeight: 18,
  },

  // Back button
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },

  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },

  // Guest button
  guestButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },

  guestButtonText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  guestButtonSubtext: {
    color: '#ADB5BD',
    fontSize: 12,
    fontWeight: '500',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },

  footerText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },

  footerLink: {
    color: '#007AFF',
    fontWeight: '600',
  },

  // Responsive adjustments
  '@media (max-width: 375)': {
    content: {
      paddingHorizontal: 20,
    },
    
    title: {
      fontSize: 24,
    },
    
    methodButton: {
      padding: 20,
    },
  },
  
  '@media (max-height: 667)': {
    header: {
      marginBottom: 32,
    },
    
    methodContainer: {
      marginBottom: 20,
    },
  },
});
