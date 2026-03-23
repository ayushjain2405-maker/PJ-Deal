"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import {
  buildCustomerMessage,
  buildVendorMessage,
  createEmptyForm,
  formatCurrency,
  formatDate,
  formatMessageNumber,
  getDeliveryBadgeLabel,
  getFilterTitle,
  isVendorMatched,
  matchesFilter,
} from "@/lib/deals";

const FILTERS = [
  { id: "all", label: "Pending deliveries", countKey: "pendingCount" },
  { id: "vendor-pending", label: "Vendor pending", countKey: "vendorPendingCount" },
  { id: "vendor-matched", label: "Vendor matched", countKey: "completedMatchCount" },
  {
    id: "customer-delivery-pending",
    label: "Customer delivery pending",
    countKey: "customerDeliveryPendingCount",
  },
  {
    id: "vendor-delivery-pending",
    label: "Vendor delivery pending",
    countKey: "vendorDeliveryPendingCount",
  },
];

export default function HomePage() {
  const [supabase] = useState(() => getSupabaseBrowser());
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });

  const [form, setForm] = useState(createEmptyForm());
  const [deals, setDeals] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let mounted = true;

    async function bootstrapAuth() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        setSession(initialSession ?? null);
      } catch (authError) {
        if (mounted) {
          setError(authError.message || "Could not start login session.");
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!session) {
      setDeals([]);
      setLoading(false);
      return;
    }

    loadDeals();
  }, [authLoading, session]);

  const counts = useMemo(
    () => ({
      pendingCount: deals.length,
      vendorPendingCount: deals.filter((deal) => !isVendorMatched(deal)).length,
      completedMatchCount: deals.filter((deal) => isVendorMatched(deal)).length,
      customerDeliveryPendingCount: deals.filter(
        (deal) => deal.customerDeliveryStatus !== "Delivered"
      ).length,
      vendorDeliveryPendingCount: deals.filter(
        (deal) => deal.vendorDeliveryStatus !== "Delivered"
      ).length,
    }),
    [deals]
  );

  const filteredDeals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return deals.filter((deal) => {
      if (!matchesFilter(deal, activeFilter)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        deal.clientName,
        deal.clientMobile,
        deal.metal,
        deal.dealType,
        deal.purity,
        deal.vendorName,
        deal.customerDeliveryStatus,
        deal.vendorDeliveryStatus,
        deal.notes,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [activeFilter, deals, searchQuery]);

  async function authorizedFetch(url, options = {}) {
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error("Please sign in to continue.");
    }

    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async function loadDeals() {
    try {
      setLoading(true);
      setError("");

      const response = await authorizedFetch("/api/deals", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not load deals.");
      }

      setDeals(payload.deals ?? []);
    } catch (loadError) {
      setError(loadError.message || "Could not load deals.");
    } finally {
      setLoading(false);
    }
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateAuthForm(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    try {
      setAuthSubmitting(true);
      setError("");
      setNotice("");

      if (authMode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: authForm.email.trim(),
          password: authForm.password,
        });

        if (signInError) {
          throw signInError;
        }

        setNotice("Signed in successfully.");
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: authForm.email.trim(),
          password: authForm.password,
        });

        if (signUpError) {
          throw signUpError;
        }

        setNotice(
          "Account created. If email confirmation is on in Supabase, verify email first."
        );
        setAuthMode("signin");
      }
    } catch (authError) {
      setError(authError.message || "Could not complete login.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setDeals([]);
    setForm(createEmptyForm());
    setSearchQuery("");
    setActiveFilter("all");
    setNotice("Signed out.");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const payload = normalizeForm(form);
      const response = await authorizedFetch("/api/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save deal.");
      }

      setDeals((current) => [result.deal, ...current]);
      setForm(createEmptyForm());
      setActiveFilter("all");
      setSearchQuery("");
      setNotice("Deal saved.");
    } catch (submitError) {
      setError(submitError.message || "Could not save deal.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateDelivery(dealId, fieldName, label) {
    try {
      setError("");

      const response = await authorizedFetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [fieldName]: "Delivered" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update delivery.");
      }

      if (result.deleted) {
        setDeals((current) => current.filter((deal) => deal.id !== dealId));
        setNotice("Both delivery sides are complete, so the deal was removed.");
        return;
      }

      setDeals((current) =>
        current.map((deal) => (deal.id === dealId ? result.deal : deal))
      );
      setNotice(`${capitalize(label)} delivery marked complete.`);
    } catch (updateError) {
      setError(updateError.message || `Could not mark ${label} delivery.`);
    }
  }

  async function copyText(value, label) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copied.`);
    } catch {
      setError("Could not copy the message.");
    }
  }

  const customerMessage = buildCustomerMessage(form);
  const vendorMessage = buildVendorMessage(form);

  if (authLoading) {
    return (
      <main className="page-shell">
        <section className="auth-shell">
          <section className="auth-card">
            <p className="section-kicker">Loading</p>
            <h1>Checking your login session.</h1>
          </section>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="page-shell">
        <section className="auth-shell">
          <div className="auth-copy">
            <p className="eyebrow">Secure Access</p>
            <h1>Sign in before using your live deal tracker.</h1>
            <p className="hero-copy">
              Your deals are now saved in the cloud and linked to your account.
              After login, the same account can be opened on mobile, laptop, and
              desktop.
            </p>
          </div>

          <section className="auth-card">
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${authMode === "signin" ? "active" : ""}`}
                onClick={() => setAuthMode("signin")}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`auth-tab ${authMode === "signup" ? "active" : ""}`}
                onClick={() => setAuthMode("signup")}
              >
                Create account
              </button>
            </div>

            {error ? <div className="alert error-alert">{error}</div> : null}
            {notice ? <div className="alert success-alert">{notice}</div> : null}

            <form className="deal-form" onSubmit={handleAuthSubmit}>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={authForm.email}
                  onChange={updateAuthForm}
                  required
                />
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={authForm.password}
                  onChange={updateAuthForm}
                  minLength={6}
                  required
                />
              </label>

              <button type="submit" className="primary-button" disabled={authSubmitting}>
                {authSubmitting
                  ? "Please wait..."
                  : authMode === "signin"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Daily Trading Workflow</p>
          <h1>Track customer and vendor deals from every device.</h1>
          <p className="hero-copy">
            Save the trade once, sync it through the cloud, send both deal
            messages, and close the deal only when delivery is complete on both
            sides.
          </p>
          <div className="sync-note">
            <span className="sync-dot" />
            Supabase-backed data sync for mobile, laptop, and desktop.
          </div>
          <div className="session-bar">
            <span>Signed in as {session.user.email}</span>
            <button type="button" className="ghost-button" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>

        <div className="hero-stats">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`stat-card stat-button ${
                activeFilter === filter.id ? "active" : ""
              }`}
              onClick={() => setActiveFilter(filter.id)}
            >
              <span>{counts[filter.countKey]}</span>
              <p>{filter.label}</p>
            </button>
          ))}
        </div>
      </header>

      {error ? <div className="alert error-alert">{error}</div> : null}
      {notice ? <div className="alert success-alert">{notice}</div> : null}

      <section className="layout">
        <section className="panel form-panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">New Deal</p>
              <h2>Customer and vendor entry</h2>
            </div>
          </div>

          <form className="deal-form" onSubmit={handleSubmit}>
            <div className="subsection">
              <div className="subsection-head">
                <p className="section-kicker">Customer Side</p>
                <h3>Deal with customer</h3>
              </div>

              <label>
                Customer name
                <input
                  name="clientName"
                  value={form.clientName}
                  onChange={updateForm}
                  required
                />
              </label>

              <label>
                Mobile number
                <input
                  name="clientMobile"
                  type="tel"
                  value={form.clientMobile}
                  onChange={updateForm}
                  placeholder="e.g. 9876543210"
                />
              </label>

              <div className="field-grid">
                <label>
                  Metal
                  <select name="metal" value={form.metal} onChange={updateForm}>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                  </select>
                </label>

                <label>
                  Customer deal type
                  <select name="dealType" value={form.dealType} onChange={updateForm}>
                    <option value="Sell">Sell</option>
                    <option value="Buy">Buy</option>
                  </select>
                </label>
              </div>

              <div className="field-grid">
                <label>
                  Weight
                  <input
                    name="weight"
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.weight}
                    onChange={updateForm}
                    required
                  />
                </label>

                <label>
                  Unit
                  <select name="unit" value={form.unit} onChange={updateForm}>
                    <option value="grams">grams</option>
                    <option value="kg">kg</option>
                    <option value="tola">tola</option>
                  </select>
                </label>
              </div>

              <div className="field-grid">
                <label>
                  Purity
                  <input
                    name="purity"
                    value={form.purity}
                    onChange={updateForm}
                    placeholder="e.g. 995"
                    required
                  />
                </label>

                <label>
                  Customer rate
                  <input
                    name="rate"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.rate}
                    onChange={updateForm}
                    required
                  />
                </label>
              </div>
            </div>

            <div className="subsection">
              <div className="subsection-head">
                <p className="section-kicker">Vendor Side</p>
                <h3>Matching vendor deal</h3>
              </div>

              <label>
                Vendor name
                <input
                  name="vendorName"
                  value={form.vendorName}
                  onChange={updateForm}
                  placeholder="e.g. Jacky"
                />
              </label>

              <div className="field-grid">
                <label>
                  Vendor deal type
                  <select
                    name="vendorDealType"
                    value={form.vendorDealType}
                    onChange={updateForm}
                  >
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                  </select>
                </label>

                <label>
                  Vendor rate
                  <input
                    name="vendorRate"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.vendorRate}
                    onChange={updateForm}
                  />
                </label>
              </div>

              <div className="field-grid">
                <label>
                  Vendor weight
                  <input
                    name="vendorWeight"
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.vendorWeight}
                    onChange={updateForm}
                  />
                </label>

                <label>
                  Vendor unit
                  <select
                    name="vendorUnit"
                    value={form.vendorUnit}
                    onChange={updateForm}
                  >
                    <option value="grams">grams</option>
                    <option value="kg">kg</option>
                    <option value="tola">tola</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="field-grid">
              <label>
                Deal date
                <input
                  name="dealDate"
                  type="date"
                  value={form.dealDate}
                  onChange={updateForm}
                  required
                />
              </label>

              <label>
                Delivery to customer
                <select
                  name="customerDeliveryStatus"
                  value={form.customerDeliveryStatus}
                  onChange={updateForm}
                >
                  <option value="Pending">Pending</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </label>
            </div>

            <div className="field-grid">
              <label>
                Delivery from vendor
                <select
                  name="vendorDeliveryStatus"
                  value={form.vendorDeliveryStatus}
                  onChange={updateForm}
                >
                  <option value="Pending">Pending</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </label>
            </div>

            <label>
              Notes
              <textarea
                name="notes"
                rows="3"
                value={form.notes}
                onChange={updateForm}
                placeholder="Optional remarks"
              />
            </label>

            <div className="message-box">
              <div className="message-head">
                <div>
                  <p className="section-kicker">Customer Message</p>
                  <h3>Preview</h3>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => copyText(customerMessage, "Customer message")}
                >
                  Copy customer
                </button>
              </div>
              <pre className="message-preview">{customerMessage}</pre>
            </div>

            <div className="message-box">
              <div className="message-head">
                <div>
                  <p className="section-kicker">Vendor Message</p>
                  <h3>Preview</h3>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => copyText(vendorMessage, "Vendor message")}
                  disabled={!vendorMessage}
                >
                  Copy vendor
                </button>
              </div>
              <pre className="message-preview">
                {vendorMessage ||
                  "Enter vendor name and vendor rate to generate the vendor message."}
              </pre>
            </div>

            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? "Saving..." : "Save deal"}
            </button>
          </form>
        </section>

        <section className="panel list-panel">
          <div className="panel-head list-head">
            <div>
              <p className="section-kicker">Active Deals</p>
              <h2>{getFilterTitle(activeFilter)}</h2>
            </div>
            <input
              type="search"
              placeholder="Search by client, mobile, vendor, purity"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="deal-list">
            {loading ? (
              <div className="empty-state">
                <div>
                  <h3>Loading deals</h3>
                  <p>Fetching synced deals from the database.</p>
                </div>
              </div>
            ) : filteredDeals.length ? (
              filteredDeals.map((deal) => (
                <article key={deal.id} className="deal-card">
                  <div className="deal-topline">
                    <div>
                      <h3 className="deal-client">{deal.clientName}</h3>
                      <p className="deal-meta">
                        {deal.dealType} {deal.metal}
                      </p>
                      <p className="deal-mobile">
                        {deal.clientMobile
                          ? `Mobile: ${deal.clientMobile}`
                          : "Mobile: not added"}
                      </p>
                    </div>
                    <span className="status-pill">{getDeliveryBadgeLabel(deal)}</span>
                  </div>

                  <dl className="deal-details">
                    <div>
                      <dt>Weight</dt>
                      <dd>
                        {formatMessageNumber(deal.weight)} {deal.unit}
                      </dd>
                    </div>
                    <div>
                      <dt>Purity</dt>
                      <dd>{deal.purity}</dd>
                    </div>
                    <div>
                      <dt>Rate</dt>
                      <dd>
                        {formatCurrency(deal.rate)} / {deal.unit}
                      </dd>
                    </div>
                    <div>
                      <dt>Vendor</dt>
                      <dd>
                        {isVendorMatched(deal)
                          ? `${deal.vendorName} at ${formatCurrency(deal.vendorRate)}`
                          : "Not punched yet"}
                      </dd>
                    </div>
                    <div>
                      <dt>Vendor weight</dt>
                      <dd>
                        {deal.vendorWeight
                          ? `${formatMessageNumber(deal.vendorWeight)} ${deal.vendorUnit}`
                          : "Not added"}
                      </dd>
                    </div>
                    <div>
                      <dt>Date</dt>
                      <dd>{formatDate(deal.dealDate)}</dd>
                    </div>
                  </dl>

                  <p className="deal-notes">{deal.notes || "No notes added."}</p>
                  <p className="deal-delivery">
                    To customer: {deal.customerDeliveryStatus} | From vendor:{" "}
                    {deal.vendorDeliveryStatus}
                  </p>

                  <div className="card-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        copyText(buildCustomerMessage(deal), "Customer message")
                      }
                    >
                      Copy customer
                    </button>

                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        copyText(buildVendorMessage(deal), "Vendor message")
                      }
                      disabled={!buildVendorMessage(deal)}
                    >
                      Copy vendor
                    </button>

                    <button
                      type="button"
                      className={`delivery-button ${
                        deal.customerDeliveryStatus === "Delivered"
                          ? "is-complete"
                          : ""
                      }`}
                      disabled={deal.customerDeliveryStatus === "Delivered"}
                      onClick={() =>
                        updateDelivery(
                          deal.id,
                          "customerDeliveryStatus",
                          "customer"
                        )
                      }
                    >
                      {deal.customerDeliveryStatus === "Delivered"
                        ? "Customer delivered"
                        : "Customer delivery pending"}
                    </button>

                    <button
                      type="button"
                      className={`delivery-button ${
                        deal.vendorDeliveryStatus === "Delivered"
                          ? "is-complete"
                          : ""
                      }`}
                      disabled={deal.vendorDeliveryStatus === "Delivered"}
                      onClick={() =>
                        updateDelivery(deal.id, "vendorDeliveryStatus", "vendor")
                      }
                    >
                      {deal.vendorDeliveryStatus === "Delivered"
                        ? "Vendor delivered"
                        : "Vendor delivery pending"}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <div>
                  <h3>No pending deals found</h3>
                  <p>
                    Add a deal on the left, or change your search and filter to
                    see matching synced deliveries.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function normalizeForm(form) {
  return {
    clientName: form.clientName.trim(),
    clientMobile: form.clientMobile.trim(),
    metal: form.metal,
    dealType: form.dealType,
    weight: Number(form.weight),
    unit: form.unit,
    purity: form.purity.trim(),
    rate: Number(form.rate),
    vendorName: form.vendorName.trim(),
    vendorDealType: form.vendorDealType,
    vendorRate: form.vendorRate === "" ? null : Number(form.vendorRate),
    vendorWeight: form.vendorWeight === "" ? null : Number(form.vendorWeight),
    vendorUnit: form.vendorUnit,
    dealDate: form.dealDate,
    customerDeliveryStatus: form.customerDeliveryStatus,
    vendorDeliveryStatus: form.vendorDeliveryStatus,
    notes: form.notes.trim(),
  };
}

function capitalize(value) {
  if (!value) {
    return "";
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
