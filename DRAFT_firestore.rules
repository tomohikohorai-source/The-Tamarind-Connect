rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 0. Global Safety Net
    match /{document=**} {
      allow read, write: if false;
    }

    // Phase 3: Primitives
    function isSignedIn() {
      return request.auth != null;
    }

    function isEmailVerified() {
      return isSignedIn() && request.auth.token.email_verified == true;
    }

    function isAdmin() {
      return isSignedIn() && (
        request.auth.token.email == 'tomohiko.horai@gmail.com' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.customUserId == 'testtest'
      );
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    // Entity Validators
    function isValidUser(data) {
      return data.uid == request.auth.uid &&
             data.parentNickname is string && data.parentNickname.size() <= 100 &&
             data.roomNumber is string && data.roomNumber.size() <= 20;
    }

    function isValidActivity(data) {
      return data.userId == request.auth.uid &&
             data.condoCode is string &&
             data.message is string && data.message.size() <= 500;
    }

    function isValidMarketItem(data) {
      return data.userId == request.auth.uid &&
             data.title is string && data.title.size() <= 100 &&
             data.price is number && data.price >= 0;
    }

    // Rules for Collections

    match /users/{userId} {
      allow get: if isSignedIn();
      allow list: if isAdmin();
      allow create: if isSignedIn() && request.auth.uid == userId && isValidUser(incoming());
      allow update: if isSignedIn() && request.auth.uid == userId && 
                    isValidUser(incoming()) &&
                    incoming().role == existing().get('role', 'user'); // Prevent self-promotion
      allow delete: if isAdmin();
    }

    match /activities/{activityId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && isValidActivity(incoming());
      allow update: if isSignedIn() && existing().userId == request.auth.uid && isValidActivity(incoming());
      allow delete: if isSignedIn() && (existing().userId == request.auth.uid || isAdmin());
    }

    match /marketItems/{itemId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && isValidMarketItem(incoming());
      allow update: if isSignedIn() && (
        // Action: Edit (Owner)
        (existing().userId == request.auth.uid && isValidMarketItem(incoming())) ||
        // Action: Request/Comment (Others)
        (incoming().diff(existing()).affectedKeys().hasOnly(['requestStatus', 'buyerId', 'buyerNickname', 'buyerAvatarIcon', 'comments', 'likes', 'lastUpdated']))
      );
      allow delete: if isSignedIn() && (existing().userId == request.auth.uid || isAdmin());
    }

    match /skills/{skillId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn();
      allow delete: if isSignedIn() && (existing().userId == request.auth.uid || isAdmin());
    }

    match /wantedItems/{itemId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn();
      allow delete: if isSignedIn() && (existing().userId == request.auth.uid || isAdmin());
    }

    match /readContent/{contentId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /condos/{condoId} {
      allow read: if true;
      allow write: if isSignedIn(); // Temporarily allow for migration, should be isAdmin() in production
    }
  }
}
