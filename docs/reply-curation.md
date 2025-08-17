# Reply Curation Feature

## Goal
Allow users to selectively display received replies on their public profile, giving them control over which content represents them best.

## Backend (MongoDB)

### Option 1: Add a `visible` flag to replies
- **Pros**: Simple implementation, just add a boolean field to existing message schema
- **Cons**: Requires filtering on query time, might be less efficient at scale

### Option 2: Create a separate `curatedReplies` array on user document
- **Pros**: Faster reads for profile display, pre-filtered collection
- **Cons**: Requires maintaining two sources of truth, potential for data inconsistency

### Recommendation
Implement Option 1 with a `visible` boolean flag (defaulting to `false`) on the message schema. This approach:
- Maintains data integrity with a single source of truth
- Simplifies writes (just toggle a flag)
- Can be optimized later with indexes if query performance becomes an issue
- Allows for easy filtering in the API layer

## Frontend

### Dashboard Integration
- Add a simple toggle switch labeled "Show on profile" next to each received reply
- Include a count of currently featured replies ("Featuring 5 replies")
- Consider a visual indicator for replies that are currently featured

### Profile Display (/u/[username])
- Create a dedicated "Featured Replies" section on the profile
- Display curated replies in a grid or list format
- Include empty state with prompt when no replies are curated
- Consider a subtle badge or highlight effect for featured replies

## User Experience
- One-tap curation: Simple toggle to feature/unfeature a reply
- No limit on number of curated replies initially (monitor usage patterns)
- Default all replies to not featured, requiring explicit curation
- Allow batch curation options if usage data shows demand
- Provide visual feedback when a reply is curated (subtle animation)

## Virality

### Sharing Incentives
- Add "Share my profile" button next to curated replies section
- Generate shareable preview cards for social media with reply count
- Create unique URLs for individual featured replies (e.g., /u/username/featured/123)

### Visitor Engagement
- Show a count of featured replies on profile ("See 12 featured replies")
- Add subtle "New" indicator for recently added featured replies
- Consider gamification elements ("First Reply Featured" achievement)
- Prompt visitors to send messages that might be featured ("Send a reply that could be featured")

## Implementation Priority
1. Add `visible` field to message schema
2. Update API endpoints to support toggling visibility
3. Implement dashboard UI for curation
4. Create featured replies section on profile page
5. Add sharing and virality features