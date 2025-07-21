# Enterprise Registration Feature Test Guide

## Overview
The enterprise registration feature has been successfully implemented. This feature allows system administrators to manually register new enterprises with login credentials.

## Implementation Summary

### 1. Components Added
- **CreateEnterpriseModal**: A comprehensive modal with 4 tabs for enterprise registration
  - Basic Info Tab: Company name, business number, industry, size, address
  - Admin Account Tab: Contact info and login credentials setup
  - Credits Tab: System admin exclusive credit allocation
  - Subscription Tab: Plan and pricing configuration

### 2. Services Modified
- **SystemAdminService**: Added `createEnterpriseWithAdmin` method
  - Uses OrganizationService for company registration
  - Handles credit allocation
  - Manages subscription overrides
  - Creates system notes

### 3. UI Changes
- Removed refresh button from Enterprise Management
- Added "기업등록" (Enterprise Registration) button
- Button styled with gradient background

## Testing Steps

1. **Login as System Admin**
   - Use system admin credentials to access the dashboard

2. **Navigate to Enterprise Management**
   - Click on "기업 관리" (Enterprise Management) section

3. **Open Registration Modal**
   - Click the "기업등록" button (blue/purple gradient button)
   - The modal should open with 4 tabs

4. **Fill Registration Form**
   - **Basic Info Tab**:
     - Company Name: Required
     - Business Number: Optional
     - Industry: Select from dropdown
     - Size: Select company size
     - Employee Count: Number input
     - Address: Full address fields
   
   - **Admin Account Tab**:
     - Contact Name: Required
     - Contact Phone: Required
     - Contact Email: Required
     - Login Email: Required (this will be the admin's login ID)
     - Password: Required (8+ chars, must include letters, numbers, special chars)
     - Password Confirm: Must match password
   
   - **Credits Tab**:
     - Initial Credits: Number of credits to allocate
     - Promotion Credits: Additional promotional credits
     - Expire Date: Optional expiration date
   
   - **Subscription Tab**:
     - Plan: TRIAL, BASIC, PREMIUM, ENTERPRISE, CUSTOM
     - Trial Days: For TRIAL plan
     - Custom Price: For CUSTOM plan
     - Special Terms: Optional
     - System Notes: Internal notes

5. **Submit Registration**
   - Click "기업 등록" button
   - Wait for success message with organization code
   - Modal should close automatically

## Key Features

### Security & Validation
- System admin access required
- Password complexity requirements enforced
- Email format validation
- Required field validation
- Tab navigation to first error

### System Admin Exclusive Features
- Credit allocation (initial + promotional)
- Credit expiration date setting
- Custom subscription pricing
- Special terms configuration
- System notes for internal tracking

### Integration Points
- Uses existing OrganizationService for registration
- Creates Firebase Auth account for admin
- Allocates credits through transaction
- Updates organization with subscription details

## Error Handling
- Duplicate business number detection
- Email already in use handling
- Form validation with inline error messages
- Transaction rollback on failure

## Success Indicators
- Success toast with organization code
- Modal closes automatically
- Enterprise appears in list immediately
- Admin can login with created credentials