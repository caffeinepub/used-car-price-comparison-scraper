import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface UpdateListingInput {
    region: string;
    model: string;
    mileage: bigint;
    source: string;
    make: string;
    trim: string;
    year: bigint;
    listingUrl: string;
    dealerName: string;
    price: bigint;
    archived: boolean;
    condition: string;
    images: Array<ExternalBlob>;
}
export type Time = bigint;
export interface PrivateNote {
    id: string;
    text: string;
    lastUpdated: Time;
}
export interface RegionalBreakdown {
    region: string;
    avgPrice: number;
    sources: Array<string>;
    listingCount: bigint;
}
export interface CreateListingInput {
    id: string;
    region: string;
    model: string;
    mileage: bigint;
    source: string;
    make: string;
    trim: string;
    year: bigint;
    listingUrl: string;
    dealerName: string;
    price: bigint;
    condition: string;
    images: Array<ExternalBlob>;
}
export interface NegotiationScore {
    listingId: string;
    score: bigint;
    factors: Array<string>;
    scoreLabel: string;
}
export interface CustomAlertFormula {
    id: string;
    name: string;
    createdAt: Time;
    conditions: Array<AlertCondition>;
}
export interface DealExpiryPrediction {
    urgency: string;
    listingId: string;
    estimatedDaysRemaining: bigint;
}
export interface AlertFormulaMatch {
    formulaName: string;
    matchedListingIds: Array<string>;
    formulaId: string;
}
export interface AlertCondition {
    field: string;
    value: string;
    operator: string;
}
export interface CrossModelResult {
    id: string;
    region: string;
    model: string;
    mileage: bigint;
    source: string;
    make: string;
    trim: string;
    year: bigint;
    pricePerMile: number;
    timestamp: Time;
    listingUrl: string;
    dealerName: string;
    price: bigint;
    archived: boolean;
    dealScore: string;
    condition: string;
    images: Array<ExternalBlob>;
}
export interface DepreciationDataPoint {
    avgPrice: number;
    monthsFromFirst: bigint;
    listingCount: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkCreateListings(inputs: Array<CreateListingInput>): Promise<void>;
    createListing(input: CreateListingInput): Promise<void>;
    deleteCustomAlertFormula(id: string): Promise<void>;
    deletePrivateNote(listingId: string): Promise<void>;
    evaluateCustomAlertFormulas(): Promise<Array<AlertFormulaMatch>>;
    getAllPrivateNotes(): Promise<Array<PrivateNote>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCrossModelSearch(maxPrice: number, maxMileage: bigint): Promise<Array<CrossModelResult>>;
    getCustomAlertFormulas(): Promise<Array<CustomAlertFormula>>;
    getDealExpiryPrediction(listingId: string): Promise<DealExpiryPrediction | null>;
    getDepreciationCurve(make: string, model: string): Promise<Array<DepreciationDataPoint>>;
    getNegotiationScore(listingId: string): Promise<NegotiationScore | null>;
    getPrivateNote(listingId: string): Promise<PrivateNote | null>;
    getRegionalBreakdown(): Promise<Array<RegionalBreakdown>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCustomAlertFormula(formula: CustomAlertFormula): Promise<void>;
    savePrivateNote(listingId: string, note: string): Promise<void>;
    updateListing(id: string, input: UpdateListingInput): Promise<void>;
}
