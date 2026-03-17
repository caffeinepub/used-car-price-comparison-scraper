import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Migration: retain old shared listings variable to avoid discard error ──
  public type OldListingData = {
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

  let listings = Map.empty<Text, OldListingData>();


  public type PricePoint = {
    price : Nat;
    timestamp : Time.Time;
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
    images : [Storage.ExternalBlob];
    timestamp : Time.Time;
    archived : Bool;
    priceHistory : [PricePoint];
  };

  public type ListingData = CarListing;

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

  public type BulkUpdateInput = {
    condition : ?Text;
    archived : ?Bool;
  };

  public type WatchlistEntry = {
    id : Nat;
    make : Text;
    model : Text;
    note : ?Text;
    createdAt : Time.Time;
  };

  public type PriceAlert = {
    id : Nat;
    make : Text;
    model : Text;
    targetPrice : Nat;
    createdAt : Time.Time;
  };

  public type SavedSearch = {
    id : Nat;
    name : Text;
    filterJson : Text;
    createdAt : Time.Time;
  };

  public type FilterPreset = {
    id : Nat;
    name : Text;
    filterJson : Text;
    presetType : Text;
    createdAt : Time.Time;
  };

  public type UserPreferences = {
    columnPrefsJson : Text;
    theme : Text;
  };

  public type DashboardWidget = {
    id : Nat;
    make : Text;
    model : Text;
    customLabel : ?Text;
    createdAt : Time.Time;
  };

  public type ActivityLogEntry = {
    id : Nat;
    action : Text;
    listingId : ?Text;
    description : Text;
    timestamp : Time.Time;
  };

  public type PrivateNote = {
    id : Text;
    text : Text;
    lastUpdated : Time.Time;
  };

  public type AlertCondition = {
    field : Text;
    operator : Text;
    value : Text;
  };

  public type CustomAlertFormula = {
    id : Text;
    name : Text;
    conditions : [AlertCondition];
    createdAt : Time.Time;
  };

  public type AlertFormulaMatch = {
    formulaId : Text;
    formulaName : Text;
    matchedListingIds : [Text];
  };

  public type DealScore = {
    listingId : Text;
    score : Text;
  };

  public type NegotiationScore = {
    listingId : Text;
    score : Nat;
    scoreLabel : Text;
    factors : [Text];
  };

  public type DealExpiryPrediction = {
    listingId : Text;
    estimatedDaysRemaining : Nat;
    urgency : Text;
  };

  public type DepreciationDataPoint = {
    monthsFromFirst : Nat;
    avgPrice : Float;
    listingCount : Nat;
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
    priceHistory : [PricePoint];
    dealScore : Text;
    pricePerMile : Float;
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

  public type MileageAdjustedListing = {
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
    priceHistory : [PricePoint];
    adjustedPrice : Float;
    pricePerMile : Float;
  };

  public type DashboardStats = {
    totalListings : Nat;
    averagePrice : Float;
    listingsThisWeek : Nat;
  };

  public type ModelCount = {
    make : Text;
    model : Text;
    count : Nat;
  };

  public type PriceDropSummary = {
    id : Text;
    make : Text;
    model : Text;
    dropAmount : Nat;
    dropPercent : Float;
  };

  public type DealSummary = {
    id : Text;
    make : Text;
    model : Text;
    price : Nat;
    dealScore : Text;
  };

  public type MarketOverview = {
    mostTrackedModels : [ModelCount];
    biggestPriceDrops : [PriceDropSummary];
    bestDeals : [DealSummary];
  };

  public type PriceDropEvent = {
    listingId : Text;
    previousPrice : Nat;
    newPrice : Nat;
    dropAmount : Nat;
    dropPercent : Float;
    timestamp : Time.Time;
  };

  public type SimilarModel = {
    make : Text;
    model : Text;
  };

  public type BestTimeToBuy = {
    signal : Text;
    reason : Text;
  };

  public type DealerRating = {
    dealerName : Text;
    rating : Nat;
    review : Text;
    reviewer : Principal;
    timestamp : Time.Time;
  };

  public type RatingAggregate = {
    avgRating : Float;
    count : Nat;
  };

  // ── Marketplace Types ──
  public type MarketplaceStatus = { #available; #sold };

  public type MarketplaceListing = {
    id : Text;
    dealerPrincipal : Principal;
    dealerName : Text;
    dealerPhone : Text;
    dealerEmail : Text;
    dealerCity : Text;
    dealerState : Text;
    make : Text;
    model : Text;
    year : Nat;
    mileage : Nat;
    price : Nat;
    trim : Text;
    condition : Text;
    description : Text;
    images : [Storage.ExternalBlob];
    status : MarketplaceStatus;
    timestamp : Time.Time;
  };

  public type CreateMarketplaceListingInput = {
    make : Text;
    model : Text;
    year : Nat;
    mileage : Nat;
    price : Nat;
    trim : Text;
    condition : Text;
    description : Text;
    images : [Storage.ExternalBlob];
    dealerPhone : Text;
    dealerEmail : Text;
    dealerCity : Text;
    dealerState : Text;
  };

  public type UpdateMarketplaceListingInput = {
    make : Text;
    model : Text;
    year : Nat;
    mileage : Nat;
    price : Nat;
    trim : Text;
    condition : Text;
    description : Text;
    images : [Storage.ExternalBlob];
    dealerPhone : Text;
    dealerEmail : Text;
    dealerCity : Text;
    dealerState : Text;
  };

  public type DealerProfile = {
    principal : Principal;
    dealerName : Text;
    phone : Text;
    email : Text;
    city : Text;
    state : Text;
    bio : Text;
  };

  public type SaveDealerProfileInput = {
    dealerName : Text;
    phone : Text;
    email : Text;
    city : Text;
    state : Text;
    bio : Text;
  };

  public type Inquiry = {
    id : Text;
    listingId : Text;
    buyerName : Text;
    buyerEmail : Text;
    buyerPhone : Text;
    message : Text;
    timestamp : Time.Time;
  };

  public type CreateInquiryInput = {
    buyerName : Text;
    buyerEmail : Text;
    buyerPhone : Text;
    message : Text;
  };

  public type DealerStorefrontResult = {
    profile : ?DealerProfile;
    listings : [MarketplaceListing];
  };

  let userListings = Map.empty<Principal, Map.Map<Text, CarListing>>();
  let userWatchlist = Map.empty<Principal, List.List<WatchlistEntry>>();
  let userPriceAlerts = Map.empty<Principal, List.List<PriceAlert>>();
  let userSavedSearches = Map.empty<Principal, List.List<SavedSearch>>();
  let userFilterPresets = Map.empty<Principal, List.List<FilterPreset>>();
  let userPreferences = Map.empty<Principal, UserPreferences>();
  let userDashboardWidgets = Map.empty<Principal, List.List<DashboardWidget>>();
  let userActivityLog = Map.empty<Principal, List.List<ActivityLogEntry>>();
  let userNotes = Map.empty<Principal, Map.Map<Text, PrivateNote>>();
  let userAlertFormulas = Map.empty<Principal, Map.Map<Text, CustomAlertFormula>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let watchlistShareTokens = Map.empty<Text, Principal>();
  let userCounters = Map.empty<Principal, Map.Map<Text, Nat>>();
  let dealerRatings = Map.empty<Text, List.List<DealerRating>>();

  // Marketplace state
  let marketplaceListings = Map.empty<Text, MarketplaceListing>();
  let dealerProfiles = Map.empty<Principal, DealerProfile>();
  let listingInquiries = Map.empty<Text, List.List<Inquiry>>();
  var marketplaceCounter : Nat = 0;
  var inquiryCounter : Nat = 0;

  func getCallerListings(caller : Principal) : Map.Map<Text, CarListing> {
    switch (userListings.get(caller)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Text, CarListing>();
        userListings.add(caller, m);
        m;
      };
    };
  };

  func nextId(caller : Principal, key : Text) : Nat {
    let counters = switch (userCounters.get(caller)) {
      case (?c) { c };
      case (null) {
        let c = Map.empty<Text, Nat>();
        userCounters.add(caller, c);
        c;
      };
    };
    let next = switch (counters.get(key)) {
      case (?n) { n + 1 };
      case (null) { 1 };
    };
    counters.add(key, next);
    next;
  };

  func addActivityLog(caller : Principal, action : Text, listingId : ?Text, description : Text) {
    let log = switch (userActivityLog.get(caller)) {
      case (?l) { l };
      case (null) {
        let l = List.empty<ActivityLogEntry>();
        userActivityLog.add(caller, l);
        l;
      };
    };
    let id = nextId(caller, "activity");
    log.add({ id; action; listingId; description; timestamp = Time.now() });
  };

  func computeDealScore(price : Nat, make : Text, model : Text, callerListings : Map.Map<Text, CarListing>) : Text {
    var total = 0.0;
    var count = 0;
    for (l in callerListings.values()) {
      if (not l.archived and l.make == make and l.model == model) {
        total += l.price.toFloat();
        count += 1;
      };
    };
    if (count == 0) { return "Fair" };
    let avg = total / count.toFloat();
    let ratio = price.toFloat() / avg;
    if (ratio < 0.9) { "Good Deal" }
    else if (ratio > 1.1) { "Overpriced" }
    else { "Fair" };
  };

  // --- Dealer Ratings -------------------------------------------
  public shared ({ caller }) func submitDealerRating(dealerName : Text, rating : Nat, review : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit dealer ratings");
    };
    if (rating < 1 or rating > 5) {
      Runtime.trap("Invalid rating: must be between 1 and 5");
    };
    let entry : DealerRating = {
      dealerName;
      rating;
      review;
      reviewer = caller;
      timestamp = Time.now();
    };
    let lst = switch (dealerRatings.get(dealerName)) {
      case (null) {
        let new = List.empty<DealerRating>();
        dealerRatings.add(dealerName, new);
        new;
      };
      case (?existing) { existing };
    };
    lst.add(entry);
  };

  public query func getDealerRatings(dealerName : Text) : async [DealerRating] {
    switch (dealerRatings.get(dealerName)) {
      case (null) { [] };
      case (?lst) { lst.toArray() };
    };
  };

  public query func getAggregateDealerRating(dealerName : Text) : async RatingAggregate {
    switch (dealerRatings.get(dealerName)) {
      case (null) { { avgRating = 0.0; count = 0 } };
      case (?lst) {
        var sum = 0;
        let arr = lst.toArray();
        for (r in arr.values()) { sum += r.rating };
        {
          count = arr.size();
          avgRating = if (arr.size() == 0) { 0.0 } else { sum.toFloat() / arr.size().toFloat() };
        };
      };
    };
  };

  public query ({ caller }) func getConfidenceScore(listingId : Text) : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get confidence scores");
    };
    let m = getCallerListings(caller);
    switch (m.get(listingId)) {
      case (null) { null };
      case (?l) {
        var score = 0;
        if (l.make != "") { score += 10 };
        if (l.model != "") { score += 10 };
        if (l.trim != "") { score += 10 };
        if (l.condition != "") { score += 10 };
        if (l.dealerName != "") { score += 10 };
        if (l.source != "") { score += 10 };
        if (l.region != "") { score += 10 };
        if (l.listingUrl != "") { score += 10 };
        if (l.year > 0) { score += 10 };
        if (l.mileage > 0) { score += 10 };
        if (l.price > 0) { score += 10 };
        if (l.priceHistory.size() > 0) { score += 10 };
        ?Nat.min(100, score);
      };
    };
  };

  // --- Marketplace Listings -------------------------------------------

  public shared ({ caller }) func createMarketplaceListing(input : CreateMarketplaceListingInput) : async MarketplaceListing {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be signed in to list vehicles");
    };
    marketplaceCounter += 1;
    let id = "mkt-" # marketplaceCounter.toText();
    let dealerName = switch (dealerProfiles.get(caller)) {
      case (?p) { p.dealerName };
      case (null) { "" };
    };
    let listing : MarketplaceListing = {
      id;
      dealerPrincipal = caller;
      dealerName;
      dealerPhone = input.dealerPhone;
      dealerEmail = input.dealerEmail;
      dealerCity = input.dealerCity;
      dealerState = input.dealerState;
      make = input.make;
      model = input.model;
      year = input.year;
      mileage = input.mileage;
      price = input.price;
      trim = input.trim;
      condition = input.condition;
      description = input.description;
      images = input.images;
      status = #available;
      timestamp = Time.now();
    };
    marketplaceListings.add(id, listing);
    listing;
  };

  public shared ({ caller }) func updateMarketplaceListing(id : Text, input : UpdateMarketplaceListingInput) : async ?MarketplaceListing {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (marketplaceListings.get(id)) {
      case (null) { null };
      case (?existing) {
        if (existing.dealerPrincipal != caller) {
          Runtime.trap("Unauthorized: You can only edit your own listings");
        };
        let updated : MarketplaceListing = {
          id = existing.id;
          dealerPrincipal = existing.dealerPrincipal;
          dealerName = existing.dealerName;
          dealerPhone = input.dealerPhone;
          dealerEmail = input.dealerEmail;
          dealerCity = input.dealerCity;
          dealerState = input.dealerState;
          make = input.make;
          model = input.model;
          year = input.year;
          mileage = input.mileage;
          price = input.price;
          trim = input.trim;
          condition = input.condition;
          description = input.description;
          images = input.images;
          status = existing.status;
          timestamp = existing.timestamp;
        };
        marketplaceListings.add(id, updated);
        ?updated;
      };
    };
  };

  public shared ({ caller }) func setMarketplaceListingStatus(id : Text, status : MarketplaceStatus) : async ?MarketplaceListing {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (marketplaceListings.get(id)) {
      case (null) { null };
      case (?existing) {
        if (existing.dealerPrincipal != caller) {
          Runtime.trap("Unauthorized: You can only update your own listings");
        };
        let updated : MarketplaceListing = {
          id = existing.id;
          dealerPrincipal = existing.dealerPrincipal;
          dealerName = existing.dealerName;
          dealerPhone = existing.dealerPhone;
          dealerEmail = existing.dealerEmail;
          dealerCity = existing.dealerCity;
          dealerState = existing.dealerState;
          make = existing.make;
          model = existing.model;
          year = existing.year;
          mileage = existing.mileage;
          price = existing.price;
          trim = existing.trim;
          condition = existing.condition;
          description = existing.description;
          images = existing.images;
          status;
          timestamp = existing.timestamp;
        };
        marketplaceListings.add(id, updated);
        ?updated;
      };
    };
  };

  public shared ({ caller }) func deleteMarketplaceListing(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (marketplaceListings.get(id)) {
      case (null) { false };
      case (?existing) {
        if (existing.dealerPrincipal != caller) {
          Runtime.trap("Unauthorized: You can only delete your own listings");
        };
        ignore(marketplaceListings.remove(id));
        true;
      };
    };
  };

  public query func getPublicMarketplaceListings() : async [MarketplaceListing] {
    marketplaceListings.toArray().vals().map(func(kv) { kv.1 }).toArray();
  };

  public query ({ caller }) func getMyMarketplaceListings() : async [MarketplaceListing] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    marketplaceListings.toArray().vals()
      .filter(func(kv) { kv.1.dealerPrincipal == caller })
      .map(func(kv) { kv.1 })
      .toArray();
  };

  public query func getDealerStorefront(dealerPrincipal : Principal) : async DealerStorefrontResult {
    let profile = dealerProfiles.get(dealerPrincipal);
    let dealerListings = marketplaceListings.toArray().vals()
      .filter(func(kv) { kv.1.dealerPrincipal == dealerPrincipal })
      .map(func(kv) { kv.1 })
      .toArray();
    { profile; listings = dealerListings };
  };

  public shared func submitInquiry(listingId : Text, input : CreateInquiryInput) : async ?Inquiry {
    switch (marketplaceListings.get(listingId)) {
      case (null) { null };
      case (?_) {
        inquiryCounter += 1;
        let id = "inq-" # inquiryCounter.toText();
        let inquiry : Inquiry = {
          id;
          listingId;
          buyerName = input.buyerName;
          buyerEmail = input.buyerEmail;
          buyerPhone = input.buyerPhone;
          message = input.message;
          timestamp = Time.now();
        };
        let lst = switch (listingInquiries.get(listingId)) {
          case (?l) { l };
          case (null) {
            let l = List.empty<Inquiry>();
            listingInquiries.add(listingId, l);
            l;
          };
        };
        lst.add(inquiry);
        ?inquiry;
      };
    };
  };

  public query ({ caller }) func getMyInquiries() : async [Inquiry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    var result = List.empty<Inquiry>();
    for (kv in marketplaceListings.toArray().vals()) {
      if (kv.1.dealerPrincipal == caller) {
        switch (listingInquiries.get(kv.0)) {
          case (null) {};
          case (?inquiries) {
            for (inq in inquiries.toArray().vals()) {
              result.add(inq);
            };
          };
        };
      };
    };
    result.toArray();
  };

  public shared ({ caller }) func saveDealerProfile(input : SaveDealerProfileInput) : async DealerProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let profile : DealerProfile = {
      principal = caller;
      dealerName = input.dealerName;
      phone = input.phone;
      email = input.email;
      city = input.city;
      state = input.state;
      bio = input.bio;
    };
    dealerProfiles.add(caller, profile);
    profile;
  };

  public query ({ caller }) func getMyDealerProfile() : async ?DealerProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    dealerProfiles.get(caller);
  };
};
