# Register Form Components

This directory contains modular form components for the registration screen, making the codebase more maintainable and easier to work with.

## Structure

```
register/
├── common/
│   └── types.ts           # Shared TypeScript interfaces
├── AddressSection.tsx     # Full address form fields
├── BirthdaySection.tsx    # Birthday date picker
├── EmailSection.tsx       # Email input field
├── FareDiscountSection.tsx # Optional fare discount selection and document upload
├── GenderSection.tsx      # Gender selection radio buttons
├── NameSection.tsx        # First and last name fields
├── PasswordSection.tsx    # Password and confirm password fields
├── PhoneSection.tsx       # Phone number input with validation
├── TermsSection.tsx       # Terms and conditions checkbox
├── UsernameSection.tsx    # Username input field
├── index.ts              # Export all components
└── README.md             # This file
```

## Components

### Basic Information
- **NameSection**: First name and last name input fields
- **EmailSection**: Email address input with validation
- **PhoneSection**: Phone number input with Philippine format validation
- **UsernameSection**: Username input with restrictions

### Security
- **PasswordSection**: Password and confirm password with toggle visibility

### Personal Details
- **AddressSection**: Complete address form (house number, street, barangay, city, province, postal code)
- **BirthdaySection**: Month dropdown, date and year inputs
- **GenderSection**: Male/Female radio button selection

### Optional Features
- **FareDiscountSection**: Discount type selection and document upload for PWD, Pregnant, Senior Citizen, Student
- **TermsSection**: Terms and conditions acceptance checkbox

## Usage

```typescript
import {
  NameSection,
  EmailSection,
  PhoneSection,
  // ... other components
} from '../components/register';

// Use in your form component
<NameSection 
  signUpData={signUpData} 
  updateSignUpData={updateSignUpData} 
/>
```

## Benefits of Modularization

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be reused in other forms
3. **Testing**: Individual components can be tested in isolation
4. **Performance**: Smaller components lead to better React performance
5. **Development**: Easier to find and modify specific form sections
6. **Collaboration**: Multiple developers can work on different sections

## Common Props

All components receive at minimum:
- `signUpData`: The current form state
- `updateSignUpData`: Function to update form fields

Some components have additional props for specific functionality (e.g., dropdown toggles, handlers).








