# Auto Track Pro

## Current State
Dealers can view buyer inquiries in their marketplace management dashboard (`/dealer/marketplace`) under an Inquiries tab. However, dealers cannot reply to these messages — they can only read them.

## Requested Changes (Diff)

### Add
- Reply functionality on each inquiry: dealers can type and send a reply message
- Reply thread view: each inquiry shows the original buyer message and all dealer replies in a conversation-style thread
- Buyer-facing reply view: buyers can see dealer replies when they view their sent inquiry (stored locally or via backend)
- Reply state stored per inquiry in frontend state (and persisted via localStorage keyed by principal for now, since backend doesn't need regeneration)
- Unread reply indicator: new replies highlighted for the dealer
- Lead status tags on each inquiry: New, Contacted, Negotiating, Sold, Lost — dealer can update per inquiry

### Modify
- Dealer Inquiries tab: expand each inquiry row to show a reply thread and reply input box
- Inquiry data model (frontend): extend to include `replies[]` array and `status` field

### Remove
- Nothing removed

## Implementation Plan
1. Extend the inquiry data model in frontend to include replies array and lead status
2. Create `useInquiryReplies` hook that persists inquiry replies and status in localStorage keyed by dealer principal
3. Update Dealer Marketplace Inquiries tab to show expandable conversation threads with reply input
4. Add lead status badge/selector (New, Contacted, Negotiating, Sold, Lost) per inquiry
5. Add reply count badge on inquiry rows
6. Ensure Back to Dashboard and X close are present
