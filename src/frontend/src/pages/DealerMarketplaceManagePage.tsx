import { useNavigate } from "@tanstack/react-router";
import {
  Car,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";
import PageHeader from "../components/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { useAppRoleContext } from "../hooks/useAppRoleContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMarketplaceStore } from "../hooks/useMarketplaceStore";
import type { MktInquiry, MktListing } from "../hooks/useMarketplaceStore";

type LeadStatus = "New" | "Contacted" | "Negotiating" | "Sold" | "Lost";

type InquiryReply = {
  id: string;
  text: string;
  timestamp: number;
};

type InquiryData = {
  replies: InquiryReply[];
  status: LeadStatus;
};

type StorageMap = Record<string, InquiryData>;

function useInquiryReplies(principalId: string | undefined) {
  const storageKey = `atp_inquiry_replies_${principalId ?? "anon"}`;

  const load = useCallback((): StorageMap => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as StorageMap) : {};
    } catch {
      return {};
    }
  }, [storageKey]);

  const save = useCallback(
    (map: StorageMap) => {
      localStorage.setItem(storageKey, JSON.stringify(map));
    },
    [storageKey],
  );

  const getReplies = useCallback(
    (inquiryId: string): InquiryReply[] => {
      return load()[inquiryId]?.replies ?? [];
    },
    [load],
  );

  const getStatus = useCallback(
    (inquiryId: string): LeadStatus => {
      return load()[inquiryId]?.status ?? "New";
    },
    [load],
  );

  const addReply = useCallback(
    (inquiryId: string, text: string): InquiryReply => {
      const map = load();
      const existing = map[inquiryId] ?? {
        replies: [],
        status: "New" as LeadStatus,
      };
      const newReply: InquiryReply = {
        id: `reply_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        text,
        timestamp: Date.now(),
      };
      const newStatus: LeadStatus =
        existing.status === "New" ? "Contacted" : existing.status;
      map[inquiryId] = {
        replies: [...existing.replies, newReply],
        status: newStatus,
      };
      save(map);
      return newReply;
    },
    [load, save],
  );

  const setStatus = useCallback(
    (inquiryId: string, status: LeadStatus) => {
      const map = load();
      const existing = map[inquiryId] ?? {
        replies: [],
        status: "New" as LeadStatus,
      };
      map[inquiryId] = { ...existing, status };
      save(map);
    },
    [load, save],
  );

  return { getReplies, addReply, getStatus, setStatus };
}

const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  New: "bg-blue-500 text-white",
  Contacted: "bg-amber-500 text-black",
  Negotiating: "bg-purple-500 text-white",
  Sold: "bg-green-500 text-white",
  Lost: "bg-red-500 text-white",
};

const fmtPrice = (p: bigint) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(p));

function InquiryCard({
  inq,
  related,
  inquiryReplies,
  onUpdate,
}: {
  inq: MktInquiry;
  related: MktListing | undefined;
  inquiryReplies: ReturnType<typeof useInquiryReplies>;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [replies, setReplies] = useState<InquiryReply[]>(() =>
    inquiryReplies.getReplies(inq.id),
  );
  const [leadStatus, setLeadStatusState] = useState<LeadStatus>(() =>
    inquiryReplies.getStatus(inq.id),
  );
  const threadRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    setReplies(inquiryReplies.getReplies(inq.id));
    setLeadStatusState(inquiryReplies.getStatus(inq.id));
  }, [inquiryReplies, inq.id]);

  const handleSend = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setSending(true);
    inquiryReplies.addReply(inq.id, trimmed);
    setReplyText("");
    refresh();
    setSending(false);
    onUpdate();
    setTimeout(() => {
      threadRef.current?.scrollTo({
        top: threadRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  };

  const handleStatusChange = (val: string) => {
    inquiryReplies.setStatus(inq.id, val as LeadStatus);
    refresh();
    onUpdate();
  };

  const hasReplies = replies.length > 0;
  const isNew = leadStatus === "New" && !hasReplies;

  return (
    <Card className="overflow-hidden transition-all" data-ocid="inquiry.card">
      <CardContent className="p-4">
        <button
          type="button"
          className="flex items-start gap-3 cursor-pointer select-none w-full text-left bg-transparent border-0 p-0"
          onClick={() => setExpanded((v) => !v)}
          data-ocid="inquiry.toggle"
        >
          <div className="relative mt-1 flex-shrink-0">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            {isNew && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{inq.buyerName}</span>
              <Badge className={LEAD_STATUS_COLORS[leadStatus]}>
                {leadStatus}
              </Badge>
              {hasReplies && (
                <Badge variant="outline" className="text-xs">
                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {inq.buyerEmail}
              {inq.buyerPhone ? ` • ${inq.buyerPhone}` : ""}
            </p>
            {related && (
              <p className="text-xs text-amber-500 mt-0.5">
                Re: {Number(related.year)} {related.make} {related.model}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {new Date(Number(inq.timestamp) / 1_000_000).toLocaleDateString()}
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {expanded && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                Lead Status:
              </span>
              <Select value={leadStatus} onValueChange={handleStatusChange}>
                <SelectTrigger
                  className="h-7 w-36 text-xs"
                  data-ocid="inquiry.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "New",
                      "Contacted",
                      "Negotiating",
                      "Sold",
                      "Lost",
                    ] as LeadStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              ref={threadRef}
              className="max-h-72 overflow-y-auto space-y-2 pr-1"
            >
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 bg-muted">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    {inq.buyerName}
                  </p>
                  <p className="text-sm">{inq.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(
                      Number(inq.timestamp) / 1_000_000,
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {replies.map((reply) => (
                <div key={reply.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-amber-500">
                    <p className="text-xs text-amber-900 font-medium mb-1">
                      You
                    </p>
                    <p className="text-sm text-black">{reply.text}</p>
                    <p className="text-[10px] text-amber-800 mt-1">
                      {new Date(reply.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <Textarea
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[70px] resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                    handleSend();
                }}
                data-ocid="inquiry.textarea"
              />
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black self-end px-3"
                disabled={sending || !replyText.trim()}
                onClick={handleSend}
                data-ocid="inquiry.submit_button"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Ctrl+Enter to send
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DealerMarketplaceManagePage() {
  const navigate = useNavigate();
  const role = useAppRoleContext();
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString();
  const marketplaceStore = useMarketplaceStore();
  const inquiryReplies = useInquiryReplies(principalId);
  const [listings, setListings] = useState<MktListing[]>([]);
  const [inquiries, setInquiries] = useState<MktInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const fetchData = useCallback(() => {
    setListings(marketplaceStore.getMyListings());
    setInquiries(marketplaceStore.getMyInquiries());
    setLoading(false);
  }, [marketplaceStore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleStatus = (listing: MktListing) => {
    setToggling(listing.id);
    const newStatus =
      "available" in listing.status ? { sold: null } : { available: null };
    marketplaceStore.setListingStatus(listing.id, newStatus);
    fetchData();
    setToggling(null);
  };

  const deleteListing = (id: string) => {
    if (!confirm("Delete this listing?")) return;
    marketplaceStore.deleteListing(id);
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  if (role !== "dealer") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Dealer Access Required</p>
          <p className="text-muted-foreground mb-4">
            Please sign in as a dealer to manage listings.
          </p>
          <Button onClick={() => navigate({ to: "/" })}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const newInquiryCount = inquiries.filter(
    (inq) =>
      inquiryReplies.getStatus(inq.id) === "New" &&
      inquiryReplies.getReplies(inq.id).length === 0,
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader
        title="My Marketplace Listings"
        description="Manage your public vehicle listings and respond to buyer inquiries"
      />
      <div className="mt-4">
        <div className="flex justify-end mb-4">
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-black"
            onClick={() => navigate({ to: "/dealer/marketplace/new" })}
            data-ocid="listings.open_modal_button"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Listing
          </Button>
        </div>

        <Tabs defaultValue="listings">
          <TabsList>
            <TabsTrigger value="listings" data-ocid="listings.tab">
              My Listings ({listings.length})
            </TabsTrigger>
            <TabsTrigger
              value="inquiries"
              data-ocid="inquiries.tab"
              className="relative"
            >
              Inquiries ({inquiries.length})
              {newInquiryCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-amber-500 text-black text-[10px] font-bold">
                  {newInquiryCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-4">
            {loading ? (
              <div
                className="text-center py-10 text-muted-foreground"
                data-ocid="listings.loading_state"
              >
                Loading...
              </div>
            ) : listings.length === 0 ? (
              <div
                className="text-center py-16"
                data-ocid="listings.empty_state"
              >
                <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold mb-2">No listings yet</p>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={() => navigate({ to: "/dealer/marketplace/new" })}
                  data-ocid="listings.primary_button"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add First Listing
                </Button>
              </div>
            ) : (
              <div className="space-y-3" data-ocid="listings.list">
                {listings.map((listing, idx) => (
                  <Card key={listing.id} data-ocid={`listings.item.${idx + 1}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-16 w-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {listing.images.length > 0 ? (
                          <img
                            src={listing.images[0].url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">
                          {Number(listing.year)} {listing.make} {listing.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {listing.trim && `${listing.trim} • `}
                          {listing.condition} •{" "}
                          {Number(listing.mileage).toLocaleString()} mi
                        </p>
                        <p className="text-amber-500 font-bold">
                          {fmtPrice(listing.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {"available" in listing.status ? (
                          <Badge className="bg-green-500 text-white">
                            Available
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500 text-white">Sold</Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={toggling === listing.id}
                          onClick={() => toggleStatus(listing)}
                          data-ocid={`listings.toggle.${idx + 1}`}
                        >
                          {"available" in listing.status ? (
                            <>
                              <XCircle className="h-3 w-3 mr-1" /> Mark Sold
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" /> Mark
                              Available
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate({
                              to: `/dealer/marketplace/edit/${listing.id}`,
                            })
                          }
                          data-ocid={`listings.edit_button.${idx + 1}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => deleteListing(listing.id)}
                          data-ocid={`listings.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inquiries" className="mt-4">
            {inquiries.length === 0 ? (
              <div
                className="text-center py-16 text-muted-foreground"
                data-ocid="inquiries.empty_state"
              >
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No inquiries yet.</p>
                <p className="text-sm mt-1">
                  Buyer messages will appear here when they contact you about a
                  listing.
                </p>
              </div>
            ) : (
              <div className="space-y-3" data-ocid="inquiries.list">
                {inquiries.map((inq, idx) => {
                  const related = listings.find((l) => l.id === inq.listingId);
                  return (
                    <div key={inq.id} data-ocid={`inquiries.item.${idx + 1}`}>
                      <InquiryCard
                        inq={inq}
                        related={related}
                        inquiryReplies={inquiryReplies}
                        onUpdate={() => forceUpdate((n) => n + 1)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
