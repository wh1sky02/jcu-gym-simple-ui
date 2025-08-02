# User Approval and Billing Integration

## Overview
When an admin approves a new user, the system now automatically handles billing transactions and revenue updates.

## What Happens When Admin Approves a User

### 1. User Status Update
- User status changes from `pending` to `approved`
- `approval_date` is set to current timestamp
- `payment_status` is updated to `paid`

### 2. Billing Transaction Update
- All pending billing transactions for the user are updated to `completed`
- `completed_at` timestamp is set to current time
- Transaction status changes from `pending` to `completed`

### 3. Revenue Calculation
- Total revenue is automatically recalculated
- Only `completed` transactions are included in revenue totals
- Admin dashboard displays updated revenue immediately

### 4. User Rejection Handling
- When admin rejects/declines a user:
  - User status changes to `suspended`
  - Billing transactions are marked as `cancelled`
  - No revenue is counted from cancelled transactions

## Database Changes

### Enhanced `approveUser` Method
```typescript
async approveUser(userId: string, action: string = 'approve') {
  // Transaction-based operation ensures data consistency
  // Updates user status, payment status, and billing transactions atomically
}
```

### Transaction States
- `pending` → `completed` (on approval)
- `pending` → `cancelled` (on rejection)

## Admin Dashboard Integration

### Revenue Display
- Real-time revenue calculation
- Only includes completed transactions
- Automatically updates after user approval/rejection

### User Management
- Approve/Reject buttons refresh all data
- Immediate visual feedback
- Consistent billing state management

## Testing

Run the test script to verify the system:
```bash
node scripts/test-user-approval.js
```

This script shows:
- Current pending users and their transactions
- Revenue breakdown by transaction status
- Expected behavior after approval

## Benefits

1. **Data Consistency**: All related records updated atomically
2. **Accurate Revenue**: Only approved users contribute to revenue
3. **Real-time Updates**: Dashboard reflects changes immediately
4. **Audit Trail**: Complete transaction history maintained
5. **Error Prevention**: Transaction-based operations prevent data corruption
