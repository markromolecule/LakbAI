import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../shared/themes/colors';

interface DiscountDocument {
  uri: string;
  name: string;
  type: string;
}

interface DiscountApplicationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (discountType: string, document: DiscountDocument | null) => void;
  currentDiscountType?: string;
  currentDocument?: DiscountDocument | null;
}

const discountTypes = [
  { value: 'Student', label: 'Student', percentage: 20, icon: '🎓' },
  { value: 'PWD', label: 'Person with Disability', percentage: 20, icon: '♿' },
  { value: 'Senior Citizen', label: 'Senior Citizen', percentage: 30, icon: '👴' },
];

export const DiscountApplicationModal: React.FC<DiscountApplicationModalProps> = ({
  visible,
  onClose,
  onSubmit,
  currentDiscountType = '',
  currentDocument = null,
}) => {
  const [selectedDiscountType, setSelectedDiscountType] = useState(currentDiscountType);
  const [selectedDocument, setSelectedDocument] = useState<DiscountDocument | null>(currentDocument);
  const [showDiscountDropdown, setShowDiscountDropdown] = useState(false);

  const handleFileSelection = () => {
    Alert.alert(
      'Select Document',
      'Choose how you want to upload your supporting document',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Camera permission is required to take photos.');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setSelectedDocument({
                  uri: asset.uri,
                  name: `photo_${Date.now()}.jpg`,
                  type: 'image/jpeg',
                });
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to take photo.');
            }
          },
        },
        {
          text: 'Choose File',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
              });

              if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setSelectedDocument({
                  uri: asset.uri,
                  name: asset.name,
                  type: asset.mimeType || 'application/pdf',
                });
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to pick document.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeDocument = () => {
    setSelectedDocument(null);
  };

  const handleSubmit = () => {
    if (!selectedDiscountType) {
      Alert.alert('Error', 'Please select a discount type.');
      return;
    }

    if (!selectedDocument) {
      Alert.alert('Error', 'Please upload a supporting document.');
      return;
    }

    onSubmit(selectedDiscountType, selectedDocument);
  };

  const handleClose = () => {
    setSelectedDiscountType(currentDiscountType);
    setSelectedDocument(currentDocument);
    setShowDiscountDropdown(false);
    onClose();
  };

  const getDiscountInfo = (type: string) => {
    return discountTypes.find(dt => dt.value === type);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Apply for Fare Discount</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Discount Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Discount Type</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowDiscountDropdown(!showDiscountDropdown)}
            >
              <Text style={[
                styles.dropdownText,
                !selectedDiscountType && styles.placeholderText
              ]}>
                {selectedDiscountType ? getDiscountInfo(selectedDiscountType)?.label : 'Choose discount type'}
              </Text>
              <Ionicons 
                name={showDiscountDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>

            {showDiscountDropdown && (
              <View style={styles.dropdownList}>
                {discountTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedDiscountType(type.value);
                      setShowDiscountDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemIcon}>{type.icon}</Text>
                    <View style={styles.dropdownItemContent}>
                      <Text style={styles.dropdownItemLabel}>{type.label}</Text>
                      <Text style={styles.dropdownItemPercentage}>{type.percentage}% discount</Text>
                    </View>
                    {selectedDiscountType === type.value && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Discount Information */}
          {selectedDiscountType && (
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Text style={styles.infoIcon}>{getDiscountInfo(selectedDiscountType)?.icon}</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>{getDiscountInfo(selectedDiscountType)?.label}</Text>
                  <Text style={styles.infoPercentage}>
                    {getDiscountInfo(selectedDiscountType)?.percentage}% fare discount
                  </Text>
                </View>
              </View>
              <Text style={styles.infoDescription}>
                You will receive a {getDiscountInfo(selectedDiscountType)?.percentage}% discount on all your jeepney rides once your application is approved.
              </Text>
            </View>
          )}

          {/* Document Upload */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supporting Document</Text>
            <Text style={styles.sectionSubtitle}>
              Upload a valid ID or certificate to verify your eligibility
            </Text>

            {!selectedDocument ? (
              <TouchableOpacity style={styles.uploadButton} onPress={handleFileSelection}>
                <Ionicons name="cloud-upload-outline" size={32} color={COLORS.primary} />
                <Text style={styles.uploadButtonText}>Upload Document</Text>
                <Text style={styles.uploadButtonSubtext}>
                  Tap to select from gallery or take a photo
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.documentContainer}>
                <View style={styles.documentInfo}>
                  {selectedDocument.type.startsWith('image/') ? (
                    <Image
                      source={{ uri: selectedDocument.uri }}
                      style={styles.documentPreview}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.pdfIcon}>
                      <Ionicons name="document-text" size={24} color="#666" />
                    </View>
                  )}
                  <View style={styles.documentDetails}>
                    <Text style={styles.documentName} numberOfLines={1}>
                      {selectedDocument.name}
                    </Text>
                    <Text style={styles.documentType}>
                      {selectedDocument.type.startsWith('image/') ? 'Image' : 'PDF'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={removeDocument} style={styles.removeButton}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Requirements */}
          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Requirements</Text>
            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.requirementText}>Valid government-issued ID or certificate</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.requirementText}>Clear and readable document</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.requirementText}>Application will be reviewed within 24-48 hours</Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!selectedDiscountType || !selectedDocument) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!selectedDiscountType || !selectedDocument}
          >
            <Text style={styles.submitButtonText}>Submit Application</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1E293B',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  dropdownItemPercentage: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  infoPercentage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#10B981',
  },
  infoDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  uploadButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  uploadButtonSubtext: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
  documentContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  documentInfo: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  documentPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  pdfIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 14,
    color: '#64748B',
  },
  removeButton: {
    padding: 4,
  },
  requirementsCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
