import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { AuthProvider } from "../shared/providers/AuthProvider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaView style={styles.rootContainer}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ 
          headerShown: false,
          contentStyle: styles.screenContent
        }} />
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  screenContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
