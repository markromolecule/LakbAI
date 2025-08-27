import { StyleSheet, Dimensions } from 'react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 40, // was 32
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48, // was 40
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoContainer: {
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F8F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  logoInner: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10, // was 6
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
    marginBottom: 28, // was 24
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginBottom: 28, // was 24
  },
  buttonsContainer: {
    marginTop: 16, // was 12
    width: '100%',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 24, // was 20
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    paddingLeft: 64,
    paddingRight: 64,
    paddingVertical: 14, // was 12
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
    fontWeight: '500',
    height: 52, // was 50
    width: '100%',
  },
  textInputFocused: {
    borderColor: '#007AFF',
    backgroundColor: '#FFFFFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  textInputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    position: 'absolute',
    left: 18,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  userIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#B0B0B0',
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: 18,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  eyeIcon: {
    width: 18,
    height: 14,
    borderRadius: 9,
    backgroundColor: '#B0B0B0',
    position: 'relative',
  },
  eyeIconVisible: {
    backgroundColor: '#007AFF',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 8, // was 6
    marginLeft: 4,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20, // was 20 earlier then 12; set to 20
    paddingHorizontal: 4,
    width: '100%',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16, // was 14
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: screenWidth - 64,
    height: 52, // was 50
    marginBottom: 20, // was 16
    marginTop: 24, // was 16
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#B0B0B0',
    shadowOpacity: 0.06,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
    paddingVertical: 16, // was 14
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: screenWidth - 64,
    height: 52, // was 50
    marginBottom: 20, // was 16
  },
  guestButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  switchToSignUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20, // was 16
  },
  switchToSignUpText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
  switchToSignUpLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '700',
  },
});

export default styles;