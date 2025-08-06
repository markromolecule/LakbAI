import React from 'react';
import {
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ visible, onClose, onAccept }) => {
  const termsText = `
LAKBAI TERMS AND CONDITIONS

Last updated: ${new Date().toLocaleDateString()}

1. ACCEPTANCE OF TERMS
By using LakbAI, you agree to be bound by these Terms and Conditions.

2. SERVICE DESCRIPTION
LakbAI is a jeepney tracking and fare calculation application designed to help passengers and drivers.

3. USER RESPONSIBILITIES
- Provide accurate information during registration
- Use the service responsibly and lawfully
- Respect other users and drivers

4. PRIVACY POLICY
We collect and process your personal data in accordance with our Privacy Policy.

5. LIMITATION OF LIABILITY
LakbAI is provided "as is" without warranties of any kind.

6. MODIFICATIONS
We reserve the right to modify these terms at any time.

7. CONTACT INFORMATION
For questions about these Terms, please contact us at support@lakbai.com

By clicking "I Accept", you acknowledge that you have read and agree to these Terms and Conditions.
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Terms and Conditions</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content}>
          <Text style={styles.text}>{termsText}</Text>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptButtonText}>I Accept</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  acceptButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TermsModal;