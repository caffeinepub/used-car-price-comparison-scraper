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
export type Time = bigint;
export interface CrossModelResult {
    id: string;
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
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCrossModelSearch(maxPrice: number, maxMileage: bigint): Promise<Array<CrossModelResult>>;
    getDepreciationCurve(make: string, model: string): Promise<Array<DepreciationDataPoint>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
