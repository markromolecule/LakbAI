import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { driverAuthService, DriverCredentials, DriverProfile } from '../../../shared/services/driverAuthService';
import { COLORS, SPACING } from '../../../shared/styles';

interface DynamicLoginViewProps {
  onLoginSuccess: (driverProfile: DriverProfile) => void;
  onBackToMainLogin: () => void;
}

export const DynamicLoginView: React.FC<DynamicLoginViewProps> = ({
  onLoginSuccess,
  onBackToMainLogin
}) => {
  const [credentials, setCredentials] = useState<DriverCredentials>({
    username: '',
    password: '',
    licenseNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Check for existing session on component mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    setLoading(true);
    try {
      const sessionResult = await driverAuthService.restoreSession();
      if (sessionResult.success && sessionResult.driverProfile) {
        console.log('✅ Existing session found');
        onLoginSuccess(sessionResult.driverProfile);
      }
    } catch (error) {
      console.log('No existing session found');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    // Validate input
    if (!credentials.username.trim()) {
      Alert.alert('Validation Error', 'Please enter your username');
      return;
    }
    
    if (!credentials.password.trim()) {
      Alert.alert('Validation Error', 'Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const loginResult = await driverAuthService.login(credentials);

      if (loginResult.success && loginResult.driverProfile) {
        Alert.alert(
          '✅ Login Successful',
          loginResult.message,
          [
            {
              text: 'Continue',
              onPress: () => onLoginSuccess(loginResult.driverProfile!)
            }
          ]
        );
      } else {
        Alert.alert(
          'Login Failed',
          loginResult.message || 'Invalid credentials. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }

    setLoading(false);
  };

  const handleTestLogin = (testCredentials: DriverCredentials) => {
    setCredentials(testCredentials);
    Alert.alert(
      'Test Credentials Loaded',
      `Username: ${testCredentials.username}\nPassword: ${testCredentials.password}\n\nTap "Login" to proceed.`,
      [{ text: 'OK' }]
    );
  };

  const mockCredentials = driverAuthService.getMockCredentials();

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBackToMainLogin}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.gray600} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Driver Login</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="car" size={48} color={COLORS.driverPrimary} />
          </View>
          <Text style={styles.logoText}>LakbAI Driver</Text>
          <Text style={styles.logoSubtext}>Dynamic Authentication System</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.gray500} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your username"
                value={credentials.username}
                onChangeText={(text) => setCredentials({ ...credentials, username: text })}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray500} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                value={credentials.password}
                onChangeText={(text) => setCredentials({ ...credentials, password: text })}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={COLORS.gray500} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* License Number Input (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>License Number (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color={COLORS.gray500} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g., D123-456-789"
                value={credentials.licenseNumber}
                onChangeText={(text) => setCredentials({ ...credentials, licenseNumber: text })}
                autoCapitalize="characters"
                editable={!loading}
              />
            </View>
          </View>

          {/* Remember Me */}
          <TouchableOpacity 
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <Ionicons 
              name={rememberMe ? "checkbox" : "square-outline"} 
              size={20} 
              color={COLORS.driverPrimary} 
            />
            <Text style={styles.rememberMeText}>Remember me for 24 hours</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
                <Text style={styles.loginButtonText}>Login</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Test Credentials Section */}
        <View style={styles.testSection}>
          <Text style={styles.testSectionTitle}>🔑 Real Driver Accounts</Text>
          <Text style={styles.testSectionSubtitle}>
            Use these real driver accounts from your database to test the system
          </Text>
          
          {mockCredentials.map((cred, index) => (
            <TouchableOpacity
              key={index}
              style={styles.testCredentialCard}
              onPress={() => handleTestLogin(cred)}
              disabled={loading}
            >
              <View style={styles.testCredentialInfo}>
                <Text style={styles.testCredentialName}>
                  {cred.username.replace('.', ' ').split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Text>
                <Text style={styles.testCredentialDetails}>
                  Username: {cred.username}
                </Text>
                <Text style={styles.testCredentialDetails}>
                  License: {cred.licenseNumber}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>Dynamic Login Features</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>Real database authentication</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>Live driver profile from database</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>Jeepney assignment verification</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>Session persistence (24 hours)</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.driverPrimaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray800,
    marginBottom: SPACING.xs,
  },
  logoSubtext: {
    fontSize: 14,
    color: COLORS.gray600,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.gray50,
  },
  textInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    fontSize: 16,
    color: COLORS.gray800,
  },
  eyeButton: {
    padding: SPACING.sm,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  rememberMeText: {
    fontSize: 14,
    color: COLORS.gray600,
    marginLeft: SPACING.sm,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.driverPrimary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.gray400,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  testSection: {
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  testSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: SPACING.xs,
  },
  testSectionSubtitle: {
    fontSize: 12,
    color: COLORS.gray600,
    marginBottom: SPACING.md,
  },
  testCredentialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  testCredentialInfo: {
    flex: 1,
  },
  testCredentialName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: SPACING.xs,
  },
  testCredentialDetails: {
    fontSize: 12,
    color: COLORS.gray600,
  },
  featuresSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.success + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  featuresSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.gray700,
    marginLeft: SPACING.sm,
  },
});

export default DynamicLoginView;
