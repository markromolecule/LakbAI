import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import auth0Service from '../../shared/services/auth0Service';
import { authService } from '../../shared/services/authService';

const Auth0DebugComponent: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testAuth0Flow = async () => {
    setIsLoading(true);
    addLog('🚀 Testing Auth0 flow...');
    
    try {
      const { result, codeVerifier } = await auth0Service.authenticate();
      addLog(`✅ Auth0 authentication result: ${result.type}`);
      
      if (result.type === 'success' && result.params.code) {
        addLog('🔄 Exchanging code for tokens...');
        const tokens = await auth0Service.exchangeCodeForTokens(
          result.params.code,
          codeVerifier
        );
        addLog(`✅ Token exchange result: ${tokens.status}`);
      }
    } catch (error) {
      addLog(`❌ Auth0 flow error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendConnectivity = async () => {
    setIsLoading(true);
    addLog('🌐 Testing backend connectivity...');
    
    try {
      const connectivity = await authService.checkBackendConnectivity();
      
      if (connectivity.reachable) {
        addLog(`✅ Backend is reachable (${connectivity.responseTime}ms)`);
      } else {
        addLog(`❌ Backend is not reachable: ${connectivity.error}`);
      }
    } catch (error) {
      addLog(`❌ Connectivity test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testHealthCheck = async () => {
    setIsLoading(true);
    addLog('🌐 Testing health check...');
    try {
      const response = await authService.performHealthCheck();
      addLog(`✅ Health check response: ${response.status}`);
      if (response.status === 'ok') {
        addLog('✅ Backend is healthy.');
      } else {
        addLog(`❌ Backend is not healthy: ${response.message}`);
      }
    } catch (error) {
      addLog(`❌ Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAuth0Backend = async () => {
    setIsLoading(true);
    addLog('🔍 Testing Auth0 backend connectivity...');
    try {
      const connectivity = await auth0Service.testBackendConnectivity();
      
      if (connectivity.reachable) {
        addLog(`✅ Auth0 backend is reachable`);
        if (connectivity.details) {
          addLog(`📊 Status: ${connectivity.details.status}`);
          addLog(`📄 Response: ${connectivity.details.response}`);
        }
      } else {
        addLog(`❌ Auth0 backend is not reachable: ${connectivity.error}`);
        if (connectivity.details) {
          addLog(`📊 Details: ${JSON.stringify(connectivity.details)}`);
        }
      }
    } catch (error) {
      addLog(`❌ Auth0 backend test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAlternativeEndpoints = async () => {
    setIsLoading(true);
    addLog('🔄 Testing alternative endpoints...');
    try {
      const response = await auth0Service.testAlternativeEndpoints();
      
      if (response.workingEndpoints.length > 0) {
        addLog(`✅ Found ${response.workingEndpoints.length} working endpoints:`);
        response.workingEndpoints.forEach(endpoint => {
          addLog(`   ✅ ${endpoint}`);
        });
      } else {
        addLog('❌ No working endpoints found');
      }
      
      if (response.errors.length > 0) {
        addLog(`⚠️ ${response.errors.length} endpoints had errors`);
        response.errors.forEach(error => {
          addLog(`   ❌ ${error.endpoint}: ${error.error}`);
        });
      }
    } catch (error) {
      addLog(`❌ Alternative endpoints test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToBackendMode = () => {
    auth0Service.resetToBackendMode();
    addLog('🔄 Reset to backend mode');
  };

  const clearAllSessions = async () => {
    try {
      await auth0Service.clearAllSessions();
      addLog('🧹 All sessions cleared');
    } catch (error) {
      addLog(`❌ Error clearing sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const debugRequest = () => {
    auth0Service.debugCurrentRequest();
    addLog('🔍 Debug info logged to console');
  };

  const clearRequest = () => {
    auth0Service.clearCurrentRequest();
    addLog('🗑️ Current request cleared');
  };

  const checkEmailUpdateNeeded = () => {
    const instructions = auth0Service.getEmailUpdateInstructions();
    addLog('📧 Email update instructions:');
    addLog(instructions);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth0 Debug Component</Text>
      
      <ScrollView style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={testAuth0Flow}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Auth0 Flow'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testBackendConnectivity}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Backend Connectivity'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testAuth0Backend}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Auth0 Backend'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testAlternativeEndpoints}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Alternative Endpoints'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testHealthCheck}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Health Check'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={resetToBackendMode}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Reset to Backend Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={clearAllSessions}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Clear All Sessions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={debugRequest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Debug Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={clearRequest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Clear Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={checkEmailUpdateNeeded}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Email Help</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={clearLogs}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Debug Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  logText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 18,
  },
});

export default Auth0DebugComponent;
