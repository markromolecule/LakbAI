import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flexGrow: 1,
    minHeight: height,
  },

  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Initialization loading
  initContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },

  initText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
  },

  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },

  logoContainer: {
    marginBottom: 32,
  },

  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 32,
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

  // Auth section styles
  authSection: {
    flex: 1,
    marginBottom: 32,
  },

  authButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },

  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    gap: 12,
  },

  loginButton: {
    backgroundColor: '#007AFF',
  },

  signupButton: {
    backgroundColor: '#28A745',
    shadowColor: '#28A745',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },



  // Loading container
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Divider styles
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9ECEF',
  },

  dividerText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },

  // Social buttons
  socialButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },

  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    gap: 10,
  },

  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9ECEF',
  },

  facebookButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9ECEF',
  },

  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  googleText: {
    color: '#DB4437',
  },

  facebookText: {
    color: '#4267B2',
  },

  // Social icons (using text as placeholders)
  googleIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DB4437',
  },

  facebookIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4267B2',
  },

  // Status container
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },

  statusText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },

  // Security section
  securitySection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },

  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },

  shieldIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#28A745',
    borderRadius: 2,
  },

  securityText: {
    fontSize: 14,
    color: '#28A745',
    fontWeight: '600',
  },

  securitySubtext: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Guest button
  guestButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },

  guestButtonText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },

  footerText: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Disabled state
  buttonDisabled: {
    opacity: 0.6,
  },

  // Responsive adjustments
  '@media (max-width: 375)': {
    innerContainer: {
      paddingHorizontal: 20,
    },
    
    title: {
      fontSize: 28,
    },
    
    socialButtons: {
      flexDirection: 'column',
      gap: 12,
    },
    
    socialButton: {
      flex: 'unset',
    },
  },
  
  '@media (max-height: 667)': {
    header: {
      marginBottom: 32,
    },
    
    logoContainer: {
      marginBottom: 20,
    },
    
    authSection: {
      marginBottom: 20,
    },
    
    securitySection: {
      marginBottom: 20,
      paddingVertical: 16,
    },
  },
});
