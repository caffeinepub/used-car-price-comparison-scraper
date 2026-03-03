import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DealerRating {
    review: string;
    timestamp: Time;
    rating: bigint;
    reviewer: Principal;
    dealerName: string;
}
export type Time = bigint;
export interface RatingAggregate {
    count: bigint;
    avgRating: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAggregateDealerRating(dealerName: string): Promise<RatingAggregate>;
    getCallerUserRole(): Promise<UserRole>;
    getConfidenceScore(listingId: string): Promise<bigint | null>;
    getDealerRatings(dealerName: string): Promise<Array<DealerRating>>;
    isCallerAdmin(): Promise<boolean>;
    submitDealerRating(dealerName: string, rating: bigint, review: string): Promise<void>;
}
