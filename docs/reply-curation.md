# Reply Curation - Implementation Spec

## Goal
Allow users to reply to messages they receive and choose which replies appear on their public profile.

## Database Changes
Extend the existing message schema with three simple fields:

- `hasReply` (Boolean, default: false) - Indicates if the user has replied to this message
- `replyContent` (String, optional) - Stores the text of the user's reply
- `isPublicOnProfile` (Boolean, default: false) - Controls if this message+reply appears on the user's profile

## Backend Implementation

### Endpoints

1. **Create Reply**
   - `POST /api/messages/:messageId/reply`
   - Body: `{ replyContent: string }`
   - Updates the original message with reply content and sets hasReply=true

2. **Toggle Profile Visibility**
   - `PUT /api/messages/:messageId/visibility`
   - Body: `{ isPublicOnProfile: boolean }`
   - Updates the isPublicOnProfile flag on the message

## Frontend Implementation

### Inbox View
- Add reply button/form below each received message
- When user submits reply, update UI to show the reply below the original message
- Add toggle switch for "Show on profile" next to each replied message

### Profile View
- In user profile, show section for "My Replies"
- Only display message+reply pairs where:
  1. hasReply = true
  2. isPublicOnProfile = true
- Display original message followed by the user's reply

## Implementation Steps

1. Update message schema with the three new fields
2. Implement the two backend endpoints
3. Add reply UI to inbox view
4. Add visibility toggle to replied messages
5. Update profile view to show curated replies

## Validation Rules

- Only message recipients can reply to messages
- Only reply creators can toggle visibility
- Empty replies are not allowed