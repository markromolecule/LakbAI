import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import styles from '../styles/LoginScreen.styles';

interface LoginData {
  username: string;
  password: string;
}

interface LoginScreenProps {
  onLogin: (data: LoginData) => void;
  onForgotPassword: () => void;
  onGuestContinue?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onForgotPassword, onGuestContinue }) => {
  const [loginData, setLoginData] = useState<LoginData>({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);



  const validateForm = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};
    
    if (!loginData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (loginData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!loginData.password) {
      newErrors.password = 'Password is required';
    } else if (loginData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      onLogin(loginData);
    } catch (error) {
      Alert.alert('Login Failed', 'Please check your credentials and try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginData, value: string) => {
    setLoginData({ ...loginData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const getInputStyle = (fieldName: string) => [
    styles.textInput,
    focusedField === fieldName && styles.textInputFocused,
    errors[fieldName as keyof typeof errors] && styles.textInputError,
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <View style={styles.logoInner} />
              </View>
            </View>
            <Text style={styles.appTitle}>LakbAI</Text>
            <Text style={styles.subtitle}>Welcome back</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Username Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={getInputStyle('username')}
                  value={loginData.username}
                  onChangeText={(text) => handleInputChange('username', text)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Username"
                  placeholderTextColor="#A0A0A0"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  textAlignVertical="center"
                />
                <View style={styles.inputIcon}>
                  <View style={styles.userIcon} />
                </View>
              </View>
              {errors.username && (
                <Animated.Text style={styles.errorText}>
                  {errors.username}
                </Animated.Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={getInputStyle('password')}
                  value={loginData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Password"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  textAlignVertical="center"
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <View style={[styles.eyeIcon, showPassword && styles.eyeIconVisible]} />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Animated.Text style={styles.errorText}>
                  {errors.password}
                </Animated.Text>
              )}
            </View>

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              <View style={styles.rememberMeContainer}>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  trackColor={{ false: '#E5E5E5', true: '#007AFF40' }}
                  thumbColor={rememberMe ? '#007AFF' : '#F4F4F4'}
                  ios_backgroundColor="#E5E5E5"
                  disabled={isLoading}
                />
                <Text style={styles.rememberMeText}>Remember me</Text>
              </View>
              
              <TouchableOpacity 
                onPress={onForgotPassword} 
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Buttons Section */}
            <View style={styles.buttonsContainer}>
              {/* Login Button */}
              <TouchableOpacity 
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled
                ]} 
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.loginButtonText}>Signing in...</Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              {/* Continue as Guest Button */}
              {onGuestContinue && (
                <TouchableOpacity 
                  style={styles.guestButton} 
                  onPress={onGuestContinue}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.guestButtonText}>Continue as Guest</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;