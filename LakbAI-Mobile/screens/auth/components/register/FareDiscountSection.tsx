import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, Alert, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import styles from '../../styles/RegisterScreen.styles';
import { FareDiscountSectionProps } from './common/types';

export const FareDiscountSection: React.FC<FareDiscountSectionProps> = ({
  signUpData,
  updateSignUpData,
  showDiscountDropdown,
  toggleDiscountDropdown,
  handleDiscountTypeSelect,
  handleDocumentUpload,
}) => {
  const discountTypes = ['PWD', 'Pregnant', 'Senior Citizen', 'Student'];

  const getDocumentTypeText = (type: string) => {
    switch (type) {
      case 'PWD': return 'PWD ID';
      case 'Pregnant': return 'Medical Certificate';
      case 'Senior Citizen': return 'Senior ID';
      case 'Student': return 'Student ID';
      default: return 'Supporting Document';
    }
  };

  const handleFileSelection = async () => {
    Alert.alert(
      'Select Document',
      'Choose how you want to upload your document',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
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
              handleDocumentUpload({
                uri: asset.uri,
                name: `document_${Date.now()}.jpg`,
                type: 'image/jpeg',
              });
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Required', 'Gallery permission is needed to select photos.');
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              handleDocumentUpload({
                uri: asset.uri,
                name: asset.fileName || `document_${Date.now()}.jpg`,
                type: asset.type || 'image/jpeg',
              });
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
                handleDocumentUpload({
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
    handleDocumentUpload(null);
  };

  return (
    <>
      <Text style={styles.sectionSubtitle}>Fare Discount (Optional)</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Discount Category</Text>
        <TouchableOpacity
          style={styles.monthDropdown}
          onPress={toggleDiscountDropdown}
        >
          <Text style={[styles.monthText, !signUpData.fareDiscount.type && styles.placeholderText]}>
            {signUpData.fareDiscount.type || 'Select discount type'}
          </Text>
          <Text style={styles.dropdownArrow}>{showDiscountDropdown ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showDiscountDropdown && (
          <View style={styles.monthDropdownList}>
            <ScrollView
              style={styles.monthScrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <TouchableOpacity
                style={styles.monthOption}
                onPress={() => handleDiscountTypeSelect('')}
              >
                <Text style={styles.monthOptionText}>No discount</Text>
              </TouchableOpacity>
              {discountTypes.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthOption,
                    index === discountTypes.length - 1 && styles.lastMonthOption
                  ]}
                  onPress={() => handleDiscountTypeSelect(type as 'PWD' | 'Pregnant' | 'Senior Citizen' | 'Student')}
                >
                  <Text style={styles.monthOptionText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {signUpData.fareDiscount.type && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Upload {getDocumentTypeText(signUpData.fareDiscount.type)} *
          </Text>

          {!signUpData.fareDiscount.document ? (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleFileSelection}
            >
              <Text style={styles.uploadButtonText}>
                📁 Select {getDocumentTypeText(signUpData.fareDiscount.type)}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.documentContainer}>
              <View style={styles.documentInfo}>
                {signUpData.fareDiscount.document.type.startsWith('image/') ? (
                  <Image
                    source={{ uri: signUpData.fareDiscount.document.uri }}
                    style={styles.documentPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.pdfIcon}>
                    <Text style={styles.pdfIconText}>📄</Text>
                  </View>
                )}
                <View style={styles.documentDetails}>
                  <Text style={styles.documentName} numberOfLines={1}>
                    {signUpData.fareDiscount.document.name}
                  </Text>
                  <Text style={styles.documentType}>
                    {signUpData.fareDiscount.document.type}
                  </Text>
                </View>
              </View>
              <View style={styles.documentActions}>
                <TouchableOpacity
                  style={styles.replaceButton}
                  onPress={handleFileSelection}
                >
                  <Text style={styles.replaceButtonText}>Replace</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={removeDocument}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.helpText}>
            Accepted formats: JPEG, PNG, PDF. File size should be under 5MB.
          </Text>
        </View>
      )}
    </>
  );
};
