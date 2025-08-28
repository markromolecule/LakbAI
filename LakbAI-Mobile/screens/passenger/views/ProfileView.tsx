import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image } from 'react-native';
import { User, Mail, Phone, MapPin, Edit, FileText, LogOut, CreditCard, Plus } from 'lucide-react-native';
import { PassengerProfile } from '../../../shared/types/authentication';
import { passengerStyles, profileStyles, homeStyles } from '../styles/ProfileScreen.styles';
import { useLogout } from '../../../shared/utils/authUtils';

interface ProfileViewProps {
  passengerProfile: PassengerProfile;
  onEditProfile?: () => void;
  onApplyForDiscount?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  passengerProfile,
  onEditProfile,
  onApplyForDiscount
}) => {
  const { logout } = useLogout();

  const getDiscountTypeDisplay = (type: string) => {
    switch (type) {
      case 'PWD': 
        return 'Person with Disability';
      case 'Pregnant': 
        return 'Pregnant';
      case 'Senior Citizen': 
        return 'Senior Citizen';
      case 'Student': 
        return 'Student';
      default: 
        return 'No discount';
    }
  };

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'PWD': return '♿';
      case 'Pregnant': return '🤱';
      case 'Senior Citizen': return '👴';
      case 'Student': return '🎓';
      default: return '💰';
    }
  };

  const getDiscountStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: '⏳ Pending Review', color: '#F59E0B' };
      case 'approved':
        return { text: '✓ Approved', color: '#10B981' };
      case 'rejected':
        return { text: '✗ Rejected', color: '#EF4444' };
      default:
        return { text: 'No discount applied', color: '#6B7280' };
    }
  };

  const getDiscountPercentage = (type: string) => {
    switch (type) {
      case 'Student': return 15;
      case 'PWD': return 20;
      case 'Senior Citizen': return 30;
      case 'Pregnant': return 0; // Pregnant discount not implemented yet
      default: return 0;
    }
  };

  const canApplyForDiscount = passengerProfile.fareDiscount.status === 'none' || 
                              passengerProfile.fareDiscount.status === 'rejected';

  return (
    <ScrollView 
      style={passengerStyles.container} 
      contentContainerStyle={passengerStyles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header Card */}
      <View style={profileStyles.profileCard}>
        <View style={profileStyles.profileHeader}>
          <View style={profileStyles.avatar}>
            <User size={40} color="white" />
          </View>
          <View style={profileStyles.profileInfo}>
            <Text style={profileStyles.profileName}>
              {passengerProfile.firstName} {passengerProfile.lastName}
            </Text>
            <Text style={profileStyles.profileTitle}>
              {passengerProfile.username === 'guest' ? 'Guest' : 'LakbAI Passenger'}
            </Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        {onEditProfile && (
          <TouchableOpacity 
            style={profileStyles.editButton}
            onPress={onEditProfile}
            accessibilityLabel="Edit Profile"
            accessibilityHint="Tap to edit your profile information"
          >
            <Edit size={16} color="#3B82F6" />
            <Text style={profileStyles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Personal Information Card */}
      <View style={profileStyles.infoCard}>
        <View style={homeStyles.sectionHeader}>
          <User size={20} color="#3B82F6" />
          <Text style={homeStyles.sectionTitle}>Personal Information</Text>
        </View>
        
        <View style={profileStyles.infoRow}>
          <Mail size={16} color="#6B7280" />
          <View style={profileStyles.infoContent}>
            <Text style={profileStyles.infoLabel}>Email</Text>
            <Text style={profileStyles.infoValue}>{passengerProfile.email}</Text>
          </View>
        </View>

        <View style={profileStyles.infoRow}>
          <Phone size={16} color="#6B7280" />
          <View style={profileStyles.infoContent}>
            <Text style={profileStyles.infoLabel}>Phone Number</Text>
            <Text style={profileStyles.infoValue}>{passengerProfile.phoneNumber}</Text>
          </View>
        </View>

        <View style={profileStyles.infoRow}>
          <User size={16} color="#6B7280" />
          <View style={profileStyles.infoContent}>
            <Text style={profileStyles.infoLabel}>Gender</Text>
            <Text style={profileStyles.infoValue}>
              {passengerProfile.personalInfo.gender === 'male' ? 'Male' : 'Female'}
            </Text>
          </View>
        </View>
      </View>

      {/* Address Information Card */}
      <View style={profileStyles.infoCard}>
        <View style={homeStyles.sectionHeader}>
          <MapPin size={20} color="#3B82F6" />
          <Text style={homeStyles.sectionTitle}>Address Information</Text>
        </View>
        
        <View style={profileStyles.addressContainer}>
          <Text style={profileStyles.addressText}>
            {passengerProfile.address.houseNumber}, {passengerProfile.address.streetName}
          </Text>
          <Text style={profileStyles.addressText}>
            {passengerProfile.address.barangay}
          </Text>
          <Text style={profileStyles.addressText}>
            {passengerProfile.address.cityMunicipality}, {passengerProfile.address.province}
          </Text>
          <Text style={profileStyles.addressText}>
            {passengerProfile.address.postalCode}
          </Text>
        </View>
      </View>

      {/* Fare Discount Card */}
      <View style={profileStyles.discountCard}>
        <View style={homeStyles.sectionHeader}>
          <CreditCard size={20} color="#16A34A" />
          <Text style={homeStyles.sectionTitle}>Fare Discount</Text>
        </View>
        
        <View style={profileStyles.discountContent}>
          <View style={profileStyles.discountTypeRow}>
            <Text style={profileStyles.discountIcon}>
              {getDiscountIcon(passengerProfile.fareDiscount.type)}
            </Text>
            <View style={profileStyles.discountInfo}>
              <Text style={profileStyles.discountType}>
                {getDiscountTypeDisplay(passengerProfile.fareDiscount.type)}
              </Text>
              {passengerProfile.fareDiscount.type && (
                <Text style={[
                  profileStyles.discountStatus,
                  { color: getDiscountStatusDisplay(passengerProfile.fareDiscount.status).color }
                ]}>
                  {getDiscountStatusDisplay(passengerProfile.fareDiscount.status).text}
                </Text>
              )}
              {passengerProfile.fareDiscount.type && passengerProfile.fareDiscount.percentage > 0 && (
                <Text style={profileStyles.discountPercentage}>
                  {passengerProfile.fareDiscount.percentage}% discount
                </Text>
              )}
            </View>
          </View>

          {passengerProfile.fareDiscount.document && (
            <View style={profileStyles.documentPreviewContainer}>
              <Text style={profileStyles.documentLabel}>Supporting Document:</Text>
              <View style={profileStyles.documentPreview}>
                {passengerProfile.fareDiscount.document.type.startsWith('image/') ? (
                  <Image
                    source={{ uri: passengerProfile.fareDiscount.document.uri }}
                    style={profileStyles.documentImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={profileStyles.pdfPreview}>
                    <FileText size={20} color="#6B7280" />
                  </View>
                )}
                <Text style={profileStyles.documentName} numberOfLines={1}>
                  {passengerProfile.fareDiscount.document.name}
                </Text>
              </View>
            </View>
          )}

          {/* Apply for Discount Button */}
          {canApplyForDiscount && onApplyForDiscount && (
            <TouchableOpacity 
              style={profileStyles.applyDiscountButton}
              onPress={onApplyForDiscount}
              accessibilityLabel="Apply for Discount"
              accessibilityHint="Tap to apply for a fare discount"
            >
              <Plus size={16} color="#3B82F6" />
              <Text style={profileStyles.applyDiscountButtonText}>Apply for Discount</Text>
            </TouchableOpacity>
          )}

          {/* Application Date */}
          {passengerProfile.fareDiscount.applicationDate && (
            <View style={profileStyles.applicationDateContainer}>
              <Text style={profileStyles.applicationDateLabel}>Application Date:</Text>
              <Text style={profileStyles.applicationDateValue}>
                {new Date(passengerProfile.fareDiscount.applicationDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Logout Section */}
      <View style={profileStyles.logoutCard}>
        <View style={homeStyles.sectionHeader}>
          <LogOut size={20} color="#DC2626" />
          <Text style={[homeStyles.sectionTitle, { color: '#DC2626' }]}>Account Settings</Text>
        </View>
        <TouchableOpacity 
          style={profileStyles.logoutButton}
          onPress={() => logout()}
          accessibilityLabel="Logout"
          accessibilityHint="Tap to logout from your passenger account"
        >
          <View style={profileStyles.logoutContent}>
            <LogOut size={18} color="#DC2626" />
            <Text style={profileStyles.logoutText}>Logout</Text>
          </View>
          <Text style={profileStyles.logoutSubtext}>Sign out of your account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
