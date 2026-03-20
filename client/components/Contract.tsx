"use client";

import { useState, useCallback } from "react";
import {
  createEscrow,
  acceptEscrow,
  submitWork,
  approveWork,
  cancelEscrow,
  raiseDispute,
  resolveDispute,
  getEscrow,
  getEscrows,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  color,
}: {
  name: string;
  params: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
    </div>
  );
}

// ── Status Config ────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; variant: "success" | "warning" | "info" | "error" }> = {
  Created:    { color: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10", border: "border-[#fbbf24]/20", dot: "bg-[#fbbf24]", variant: "warning" },
  Accepted:   { color: "text-[#60a5fa]", bg: "bg-[#60a5fa]/10", border: "border-[#60a5fa]/20", dot: "bg-[#60a5fa]", variant: "info" },
  Submitted:  { color: "text-[#a78bfa]", bg: "bg-[#a78bfa]/10", border: "border-[#a78bfa]/20", dot: "bg-[#a78bfa]", variant: "info" },
  Completed:  { color: "text-[#34d399]", bg: "bg-[#34d399]/10", border: "border-[#34d399]/20", dot: "bg-[#34d399]", variant: "success" },
  Cancelled:  { color: "text-[#f87171]", bg: "bg-[#f87171]/10", border: "border-[#f87171]/20", dot: "bg-[#f87171]", variant: "error" },
  Disputed:   { color: "text-[#fb923c]", bg: "bg-[#fb923c]/10", border: "border-[#fb923c]/20", dot: "bg-[#fb923c]", variant: "warning" },
  Resolved:   { color: "text-[#94a3b8]", bg: "bg-[#94a3b8]/10", border: "border-[#94a3b8]/20", dot: "bg-[#94a3b8]", variant: "info" },
};

// ── Types ─────────────────────────────────────────────────────

type EscrowStatus = "Created" | "Accepted" | "Submitted" | "Completed" | "Cancelled" | "Disputed" | "Resolved";

interface EscrowData {
  client: string;
  freelancer: string;
  description: string;
  amount: string;
  status: EscrowStatus;
}

// ── Main Component ───────────────────────────────────────────

type Tab = "list" | "create" | "detail";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Create form
  const [freelancer, setFreelancer] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Escrow list
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const [isLoadingEscrows, setIsLoadingEscrows] = useState(false);

  // Escrow detail
  const [selectedEscrowId, setSelectedEscrowId] = useState<string>("");
  const [detailEscrowId, setDetailEscrowId] = useState("");
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailEscrow, setDetailEscrow] = useState<EscrowData | null>(null);
  const [clientShare, setClientShare] = useState("50");

  // Action states
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const showSuccess = (msg: string) => {
    setTxStatus(msg);
    setTimeout(() => setTxStatus(null), 5000);
  };

  const loadEscrows = useCallback(async () => {
    setIsLoadingEscrows(true);
    try {
      const result = await getEscrows(walletAddress || undefined);
      if (Array.isArray(result)) {
        setEscrows(result as unknown as EscrowData[]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load escrows");
    } finally {
      setIsLoadingEscrows(false);
    }
  }, [walletAddress]);

  const loadEscrowDetail = useCallback(async (id: string) => {
    setIsLoadingDetail(true);
    setDetailEscrow(null);
    try {
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) { setError("Invalid escrow ID"); return; }
      const result = await getEscrow(idNum, walletAddress || undefined);
      if (result) {
        setDetailEscrow(result as unknown as EscrowData);
        setDetailEscrowId(id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Escrow not found");
    } finally {
      setIsLoadingDetail(false);
    }
  }, [walletAddress]);

  const handleCreate = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!freelancer.trim() || !description.trim() || !amount.trim()) return setError("Fill in all fields");
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return setError("Invalid amount");
    setError(null);
    setIsCreating(true);
    setTxStatus("Awaiting signature...");
    try {
      // Convert to stroops (7 decimal places for XLM on Soroban)
      const amountI128 = BigInt(Math.floor(amountNum * 10_000_000));
      await createEscrow(walletAddress, freelancer.trim(), description.trim(), amountI128);
      showSuccess("Escrow created on-chain!");
      setFreelancer(""); setDescription(""); setAmount("");
      setTimeout(() => setActiveTab("list"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsCreating(false);
    }
  }, [walletAddress, freelancer, description, amount]);

  const handleAccept = useCallback(async () => {
    if (!walletAddress || !detailEscrowId) return;
    setError(null);
    setIsAccepting(true);
    setTxStatus("Awaiting signature...");
    try {
      await acceptEscrow(walletAddress, parseInt(detailEscrowId, 10));
      showSuccess("Escrow accepted!");
      loadEscrowDetail(detailEscrowId);
      loadEscrows();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsAccepting(false);
    }
  }, [walletAddress, detailEscrowId, loadEscrowDetail, loadEscrows]);

  const handleSubmit = useCallback(async () => {
    if (!walletAddress || !detailEscrowId) return;
    setError(null);
    setIsSubmitting(true);
    setTxStatus("Awaiting signature...");
    try {
      await submitWork(walletAddress, parseInt(detailEscrowId, 10));
      showSuccess("Work submitted!");
      loadEscrowDetail(detailEscrowId);
      loadEscrows();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [walletAddress, detailEscrowId, loadEscrowDetail, loadEscrows]);

  const handleApprove = useCallback(async () => {
    if (!walletAddress || !detailEscrowId) return;
    setError(null);
    setIsApproving(true);
    setTxStatus("Awaiting signature...");
    try {
      await approveWork(walletAddress, parseInt(detailEscrowId, 10));
      showSuccess("Work approved! Escrow completed.");
      loadEscrowDetail(detailEscrowId);
      loadEscrows();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsApproving(false);
    }
  }, [walletAddress, detailEscrowId, loadEscrowDetail, loadEscrows]);

  const handleCancel = useCallback(async () => {
    if (!walletAddress || !detailEscrowId) return;
    setError(null);
    setIsCancelling(true);
    setTxStatus("Awaiting signature...");
    try {
      await cancelEscrow(walletAddress, parseInt(detailEscrowId, 10));
      showSuccess("Escrow cancelled.");
      loadEscrowDetail(detailEscrowId);
      loadEscrows();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsCancelling(false);
    }
  }, [walletAddress, detailEscrowId, loadEscrowDetail, loadEscrows]);

  const handleDispute = useCallback(async () => {
    if (!walletAddress || !detailEscrowId) return;
    setError(null);
    setIsDisputing(true);
    setTxStatus("Awaiting signature...");
    try {
      await raiseDispute(walletAddress, parseInt(detailEscrowId, 10));
      showSuccess("Dispute raised.");
      loadEscrowDetail(detailEscrowId);
      loadEscrows();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsDisputing(false);
    }
  }, [walletAddress, detailEscrowId, loadEscrowDetail, loadEscrows]);

  const handleResolve = useCallback(async () => {
    if (!walletAddress || !detailEscrowId) return;
    const share = parseInt(clientShare, 10);
    if (isNaN(share) || share < 0 || share > 100) return setError("Client share must be 0-100");
    setError(null);
    setIsResolving(true);
    setTxStatus("Awaiting signature...");
    try {
      await resolveDispute(walletAddress, parseInt(detailEscrowId, 10), share);
      showSuccess("Dispute resolved.");
      loadEscrowDetail(detailEscrowId);
      loadEscrows();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsResolving(false);
    }
  }, [walletAddress, detailEscrowId, clientShare, loadEscrowDetail, loadEscrows]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "list", label: "Escrows", icon: <ListIcon />, color: "#4fc3f7" },
    { key: "create", label: "Create", icon: <PlusIcon />, color: "#7c6cf0" },
    { key: "detail", label: "Detail", icon: <RefreshIcon />, color: "#fbbf24" },
  ];

  const isWalletClient = walletAddress && detailEscrow?.client === walletAddress;
  const isWalletFreelancer = walletAddress && detailEscrow?.freelancer === walletAddress;

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("on-chain") || txStatus.includes("approved") || txStatus.includes("created") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Freelance Escrow</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <Badge variant="info" className="text-[10px]">Soroban</Badge>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* List */}
            {activeTab === "list" && (
              <div className="space-y-5">
                <MethodSignature name="get_escrows" params="() -> Vec<Escrow>" color="#4fc3f7" />
                <ShimmerButton onClick={loadEscrows} disabled={isLoadingEscrows} shimmerColor="#4fc3f7" className="w-full">
                  {isLoadingEscrows ? <><SpinnerIcon /> Loading...</> : <><RefreshIcon /> Load All Escrows</>}
                </ShimmerButton>

                {escrows.length > 0 && (
                  <div className="space-y-3 animate-fade-in-up">
                    {escrows.map((escrow, i) => {
                      const statusCfg = STATUS_CONFIG[escrow.status] || STATUS_CONFIG.Created;
                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/[0.1] transition-all cursor-pointer"
                          onClick={() => { setSelectedEscrowId(String(i)); loadEscrowDetail(String(i)); setActiveTab("detail"); }}
                        >
                          <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.04]">
                            <span className="font-mono text-xs text-white/40">#{i}</span>
                            <Badge variant={statusCfg.variant}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
                              {escrow.status}
                            </Badge>
                          </div>
                          <div className="p-4 space-y-2">
                            <p className="text-xs text-white/50 truncate">{String(escrow.description)}</p>
                            <div className="flex justify-between">
                              <span className="text-[10px] text-white/25">Amount</span>
                              <span className="text-xs font-mono text-white/60">{Number(escrow.amount) / 10_000_000} XLM</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {escrows.length === 0 && !isLoadingEscrows && (
                  <p className="text-center text-xs text-white/20 py-4">No escrows found.</p>
                )}
              </div>
            )}

            {/* Create */}
            {activeTab === "create" && (
              <div className="space-y-5">
                <MethodSignature
                  name="create_escrow"
                  params="(client, freelancer, description, amount)"
                  color="#7c6cf0"
                />
                <Input label="Freelancer Address (G...)" value={freelancer} onChange={(e) => setFreelancer(e.target.value)} placeholder="G..." />
                <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Build a landing page" />
                <Input label="Amount (XLM)" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100" type="number" />
                {walletAddress ? (
                  <ShimmerButton onClick={handleCreate} disabled={isCreating} shimmerColor="#7c6cf0" className="w-full">
                    {isCreating ? <><SpinnerIcon /> Creating...</> : <><PlusIcon /> Create Escrow</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to create escrow
                  </button>
                )}
              </div>
            )}

            {/* Detail */}
            {activeTab === "detail" && (
              <div className="space-y-5">
                <MethodSignature name="get_escrow" params="(escrow_id: u64) -> Escrow" color="#fbbf24" />
                <div className="flex gap-2">
                  <div className="flex-1 group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#fbbf24]/30">
                    <input
                      value={selectedEscrowId}
                      onChange={(e) => setSelectedEscrowId(e.target.value)}
                      placeholder="Escrow ID..."
                      className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
                    />
                  </div>
                  <ShimmerButton onClick={() => loadEscrowDetail(selectedEscrowId)} disabled={isLoadingDetail} shimmerColor="#fbbf24" className="px-4">
                    {isLoadingDetail ? <SpinnerIcon /> : <RefreshIcon />}
                  </ShimmerButton>
                </div>

                {detailEscrow && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in-up">
                    <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">Escrow #{detailEscrowId}</span>
                      {(() => {
                        const cfg = STATUS_CONFIG[detailEscrow.status] || STATUS_CONFIG.Created;
                        return <Badge variant={cfg.variant}><span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />{detailEscrow.status}</Badge>;
                      })()}
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Description</span>
                        <span className="font-mono text-sm text-white/80 text-right max-w-[60%] truncate">{String(detailEscrow.description)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Amount</span>
                        <span className="font-mono text-sm text-white/80">{Number(detailEscrow.amount) / 10_000_000} XLM</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Client</span>
                        <span className="font-mono text-sm text-white/80">{truncate(String(detailEscrow.client))}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Freelancer</span>
                        <span className="font-mono text-sm text-white/80">{truncate(String(detailEscrow.freelancer))}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-white/[0.06] p-4 space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-white/20 mb-3">Actions</p>

                      {detailEscrow.status === "Created" && isWalletFreelancer && (
                        <ShimmerButton onClick={handleAccept} disabled={isAccepting} shimmerColor="#34d399" className="w-full">
                          {isAccepting ? <><SpinnerIcon /> Accepting...</> : <><CheckIcon /> Accept Escrow</>}
                        </ShimmerButton>
                      )}

                      {detailEscrow.status === "Created" && isWalletClient && (
                        <ShimmerButton onClick={handleCancel} disabled={isCancelling} shimmerColor="#f87171" className="w-full">
                          {isCancelling ? <><SpinnerIcon /> Cancelling...</> : <><AlertIcon /> Cancel Escrow</>}
                        </ShimmerButton>
                      )}

                      {detailEscrow.status === "Accepted" && isWalletFreelancer && (
                        <ShimmerButton onClick={handleSubmit} disabled={isSubmitting} shimmerColor="#a78bfa" className="w-full">
                          {isSubmitting ? <><SpinnerIcon /> Submitting...</> : <><CheckIcon /> Submit Work</>}
                        </ShimmerButton>
                      )}

                      {detailEscrow.status === "Submitted" && isWalletClient && (
                        <ShimmerButton onClick={handleApprove} disabled={isApproving} shimmerColor="#34d399" className="w-full">
                          {isApproving ? <><SpinnerIcon /> Approving...</> : <><CheckIcon /> Approve & Complete</>}
                        </ShimmerButton>
                      )}

                      {(detailEscrow.status === "Accepted" || detailEscrow.status === "Submitted") && (
                        <button
                          onClick={handleDispute}
                          disabled={isDisputing}
                          className="w-full rounded-xl border border-[#fb923c]/20 bg-[#fb923c]/[0.03] py-3 text-sm text-[#fb923c]/70 hover:border-[#fb923c]/40 hover:text-[#fb923c]/90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isDisputing ? <><SpinnerIcon /> Raising...</> : <><AlertIcon /> Raise Dispute</>}
                        </button>
                      )}

                      {detailEscrow.status === "Disputed" && isWalletClient && (
                        <div className="space-y-2">
                          <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px focus-within:border-[#fb923c]/30">
                            <input
                              value={clientShare}
                              onChange={(e) => setClientShare(e.target.value)}
                              placeholder="Client share % (0-100)"
                              className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
                            />
                          </div>
                          <ShimmerButton onClick={handleResolve} disabled={isResolving} shimmerColor="#fb923c" className="w-full">
                            {isResolving ? <><SpinnerIcon /> Resolving...</> : <><CheckIcon /> Resolve Dispute</>}
                          </ShimmerButton>
                        </div>
                      )}

                      {(!walletAddress || (!isWalletClient && !isWalletFreelancer)) && (
                        <p className="text-center text-xs text-white/20 py-2">
                          {walletAddress ? "Connect as client or freelancer to take actions" : "Connect wallet to interact"}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Freelance Escrow &middot; Soroban</p>
            <div className="flex items-center gap-2">
              {["Created", "Accepted", "Submitted", "Completed"].map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={cn("h-1 w-1 rounded-full", STATUS_CONFIG[s]?.dot ?? "bg-white/20")} />
                  <span className="font-mono text-[9px] text-white/15">{s}</span>
                  {i < 3 && <span className="text-white/10 text-[8px]">&rarr;</span>}
                </span>
              ))}
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
