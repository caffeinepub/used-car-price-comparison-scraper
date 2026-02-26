import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Set "mo:core/Set";

import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Array "mo:core/Array";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type DepreciationDataPoint = {
    monthsFromFirst : Nat;
    avgPrice : Float;
    listingCount : Nat;
  };

  public type CarListing = {
    id : Text;
    make : Text;
    model : Text;
    year : Nat;
    mileage : Nat;
    price : Nat;
    trim : Text;
    condition : Text;
    dealerName : Text;
    source : Text;
    region : Text;
    listingUrl : Text;
    timestamp : Time.Time;
    archived : Bool;
  };

  public type ListingData = {
    id : Text;
    make : Text;
    model : Text;
    year : Nat;
    mileage : Nat;
    price : Nat;
    trim : Text;
    condition : Text;
    dealerName : Text;
    source : Text;
    region : Text;
    listingUrl : Text;
    images : [Storage.ExternalBlob];
    timestamp : Time.Time;
    archived : Bool;
  };

  public type CreateListingInput = {
    id : Text;
    make : Text;
    model : Text;
    year : Nat;
    mileage : Nat;
    price : Nat;
    trim : Text;
    condition : Text;
    dealerName : Text;
    source : Text;
    region : Text;
    listingUrl : Text;
    images : [Storage.ExternalBlob];
  };

  public type UpdateListingInput = {
    make : Text;
    model : Text;
    year : Nat;
    mileage : Nat;
    price : Nat;
    trim : Text;
    condition : Text;
    dealerName : Text;
    source : Text;
    region : Text;
    listingUrl : Text;
    images : [Storage.ExternalBlob];
    archived : Bool;
  };

  public type RegionalBreakdown = {
    region : Text;
    listingCount : Nat;
    avgPrice : Float;
    sources : [Text];
  };

  public type UserProfile = {
    name : Text;
  };

  public type CrossModelResult = {
    id : Text;
    make : Text;
    model : Text;
    year : Nat;
    mileage : Nat;
    price : Nat;
    trim : Text;
    condition : Text;
    dealerName : Text;
    source : Text;
    region : Text;
    listingUrl : Text;
    images : [Storage.ExternalBlob];
    timestamp : Time.Time;
    archived : Bool;
    dealScore : Text;
    pricePerMile : Float;
  };

  public type PrivateNote = {
    id : Text;
    text : Text;
    lastUpdated : Time.Time;
  };

  let listings = Map.empty<Text, ListingData>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let userNotes = Map.empty<Principal, Map.Map<Text, PrivateNote>>();

  // ── Listings: write operations require #user ──────────────────────────────

  public shared ({ caller }) func createListing(input : CreateListingInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create listings");
    };
    let listing : ListingData = {
      id = input.id;
      make = input.make;
      model = input.model;
      year = input.year;
      mileage = input.mileage;
      price = input.price;
      trim = input.trim;
      condition = input.condition;
      dealerName = input.dealerName;
      source = input.source;
      region = input.region;
      listingUrl = input.listingUrl;
      images = input.images;
      timestamp = Time.now();
      archived = false;
    };
    listings.add(input.id, listing);
  };

  public shared ({ caller }) func bulkCreateListings(inputs : [CreateListingInput]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create listings");
    };
    for (input in inputs.values()) {
      let listing : ListingData = {
        id = input.id;
        make = input.make;
        model = input.model;
        year = input.year;
        mileage = input.mileage;
        price = input.price;
        trim = input.trim;
        condition = input.condition;
        dealerName = input.dealerName;
        source = input.source;
        region = input.region;
        listingUrl = input.listingUrl;
        images = input.images;
        timestamp = Time.now();
        archived = false;
      };
      listings.add(input.id, listing);
    };
  };

  public shared ({ caller }) func updateListing(id : Text, input : UpdateListingInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update listings");
    };
    switch (listings.get(id)) {
      case (null) {
        Runtime.trap("Listing not found");
      };
      case (?existing) {
        let updated : ListingData = {
          id = existing.id;
          make = input.make;
          model = input.model;
          year = input.year;
          mileage = input.mileage;
          price = input.price;
          trim = input.trim;
          condition = input.condition;
          dealerName = input.dealerName;
          source = input.source;
          region = input.region;
          listingUrl = input.listingUrl;
          images = input.images;
          timestamp = existing.timestamp;
          archived = input.archived;
        };
        listings.add(id, updated);
      };
    };
  };

  // ── Private Notes for Listings ────────────────────────────────────────────

  public shared ({ caller }) func savePrivateNote(listingId : Text, note : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save notes");
    };
    let currentTime = Time.now();
    let newNote : PrivateNote = {
      id = listingId;
      text = note;
      lastUpdated = currentTime;
    };

    switch (userNotes.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, PrivateNote>();
        newMap.add(listingId, newNote);
        userNotes.add(caller, newMap);
      };
      case (?existingMap) {
        existingMap.add(listingId, newNote);
      };
    };
    ();
  };

  public query ({ caller }) func getPrivateNote(listingId : Text) : async ?PrivateNote {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get notes");
    };
    switch (userNotes.get(caller)) {
      case (null) { null };
      case (?existingMap) {
        existingMap.get(listingId);
      };
    };
  };

  public shared ({ caller }) func deletePrivateNote(listingId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete notes");
    };
    switch (userNotes.get(caller)) {
      case (null) { () };
      case (?existingMap) {
        existingMap.remove(listingId);
      };
    };
    ();
  };

  public query ({ caller }) func getAllPrivateNotes() : async [PrivateNote] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get notes");
    };
    switch (userNotes.get(caller)) {
      case (null) { [] };
      case (?existingMap) {
        existingMap.values().toArray();
      };
    };
  };

  // ── Regional breakdown: public, no auth required ──────────────────────────

  public query func getRegionalBreakdown() : async [RegionalBreakdown] {
    let regionMap = Map.empty<Text, List.List<ListingData>>();

    for (listing in listings.values()) {
      if (not listing.archived and listing.region != "") {
        switch (regionMap.get(listing.region)) {
          case (null) {
            let newList = List.empty<ListingData>();
            newList.add(listing);
            regionMap.add(listing.region, newList);
          };
          case (?existing) {
            existing.add(listing);
          };
        };
      };
    };

    let resultList = List.empty<RegionalBreakdown>();

    for ((region, regionListings) in regionMap.entries()) {
      if (regionListings.size() > 0) {
        var totalPrice = 0.0;
        let sourcesSet = Set.empty<Text>();
        for (listing in regionListings.values()) {
          totalPrice += listing.price.toFloat();
          sourcesSet.add(listing.source);
        };

        let sourcesArray = sourcesSet.toArray();
        resultList.add({
          region;
          avgPrice = totalPrice / regionListings.size().toFloat();
          listingCount = regionListings.size();
          sources = sourcesArray;
        });
      };
    };

    let finalResult = resultList.toArray().sort(
      func(a, b) {
        Nat.compare(b.listingCount, a.listingCount);
      }
    );
    finalResult;
  };

  // ── Depreciation curve: public read, no auth required ────────────────────

  public query func getDepreciationCurve(make : Text, model : Text) : async [DepreciationDataPoint] {
    let filteredListings = List.empty<ListingData>();
    var hasActiveListing = false;

    for (listing in listings.values()) {
      if (not listing.archived and listing.make == make and listing.model == model) {
        filteredListings.add(listing);
        hasActiveListing := true;
      };
    };

    if (filteredListings.size() <= 1 or not hasActiveListing) {
      return [];
    };

    let orderedListings = filteredListings.toArray();

    if (orderedListings.size() <= 1) {
      return [];
    };

    let firstListing = orderedListings[0];
    let firstTimestamp = firstListing.timestamp;
    let secondsPerMonth = 30 * 24 * 3600;
    let depreciationBuckets = Map.empty<Nat, List.List<ListingData>>();

    for (listing in orderedListings.values()) {
      let timeDiff = listing.timestamp.toNat() - firstTimestamp.toNat();
      let monthsFromFirst = timeDiff / secondsPerMonth;

      switch (depreciationBuckets.get(monthsFromFirst)) {
        case (null) {
          let newListings = List.empty<ListingData>();
          newListings.add(listing);
          depreciationBuckets.add(monthsFromFirst, newListings);
        };
        case (?existing) {
          existing.add(listing);
        };
      };
    };

    let result = List.empty<DepreciationDataPoint>();
    for ((months, bucketListings) in depreciationBuckets.entries()) {
      if (bucketListings.size() > 0) {
        var totalPrice = 0.0;
        for (listing in bucketListings.values()) {
          totalPrice += listing.price.toFloat();
        };
        result.add({
          monthsFromFirst = months;
          avgPrice = totalPrice / bucketListings.size().toFloat();
          listingCount = bucketListings.size();
        });
      };
    };

    result.toArray();
  };

  // ── User profiles ─────────────────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ── Cross-model search: public read, no auth required ────────────────────

  func calculateCrossModelDealScore(price : Nat, make : Text, model : Text) : Text {
    let validListings = listings.values().filter(
      func(listing) {
        not listing.archived and listing.make == make and listing.model == model
      }
    );
    let total = validListings.foldLeft(0.0, func(acc, listing) { acc + listing.price.toFloat() });
    let count = validListings.foldLeft(0, func(acc, _) { acc + 1 });

    if (count == 0) {
      return "Fair";
    };

    let avg = total / count.toFloat();
    let ratio = price.toFloat() / avg;

    switch (ratio < 0.9, ratio > 1.1) {
      case (true, _) { "Good Deal" };
      case (_, true) { "Overpriced" };
      case (_, _) { "Fair" };
    };
  };

  public query func getCrossModelSearch(maxPrice : Float, maxMileage : Nat) : async [CrossModelResult] {
    let filteredList = List.empty<CrossModelResult>();

    for (listing in listings.values()) {
      if (not listing.archived) {
        let priceFloat = listing.price.toFloat();
        let meetsPrice = priceFloat <= maxPrice;
        let meetsMileage = listing.mileage <= maxMileage or listing.mileage == 0;

        if (meetsPrice and meetsMileage) {
          let dealScore = calculateCrossModelDealScore(listing.price, listing.make, listing.model);
          let pricePerMile = if (listing.mileage > 0) {
            priceFloat / listing.mileage.toFloat();
          } else { 0.0 };

          filteredList.add({
            id = listing.id;
            make = listing.make;
            model = listing.model;
            year = listing.year;
            mileage = listing.mileage;
            price = listing.price;
            trim = listing.trim;
            condition = listing.condition;
            dealerName = listing.dealerName;
            source = listing.source;
            region = listing.region;
            listingUrl = listing.listingUrl;
            images = listing.images;
            timestamp = listing.timestamp;
            archived = listing.archived;
            dealScore;
            pricePerMile;
          });
        };
      };
    };

    let arr = filteredList.toArray();

    let dealScorePriority = func(score : Text) : Nat {
      if (score == "Good Deal") { 0 }
      else if (score == "Fair") { 1 }
      else { 2 };
    };

    let sortedArray = arr.sort(
      func(a, b) {
        let pa = dealScorePriority(a.dealScore);
        let pb = dealScorePriority(b.dealScore);
        if (pa != pb) {
          Nat.compare(pa, pb);
        } else {
          Nat.compare(a.price, b.price);
        };
      }
    );

    sortedArray;
  };
};
