/**
 * NegotiationPanel
 * Renders the full pre-contract negotiation UI for either party.
 *
 * Props:
 *   negotiation       {Object}   — OrderNegotiationDTO from backend
 *   role              {string}   — 'client' | 'caregiver'
 *   order             {Object}   — the parent order (for context labels)
 *   onNegotiationUpdate {fn}     — called with new DTO after any mutation
 *   onContractCreated   {fn}     — called with (contractId, negotiationDTO) when converted
 */
import { useState } from "react";
import { toast } from "react-toastify";
import NegotiationService from "../../services/negotiationService";
import "./NegotiationPanel.css";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const formatTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

const TaskList = ({ tasks, editable, onRemove }) => (
  <ul className="neg-task-list">
    {tasks.map((t, i) => (
      <li key={i} className="neg-task-item">
        <span>• {t}</span>
        {editable && (
          <button className="neg-remove-btn" onClick={() => onRemove(i)} title="Remove task">✕</button>
        )}
      </li>
    ))}
  </ul>
);

const ScheduleList = ({ slots, editable, onRemove }) => (
  <div className="neg-schedule-list">
    {slots.map((s, i) => (
      <div key={i} className="neg-schedule-slot">
        <span className="neg-slot-day">{s.dayOfWeek}</span>
        <span className="neg-slot-time">{formatTime(s.startTime)} – {formatTime(s.endTime)}</span>
        {editable && (
          <button className="neg-remove-btn" onClick={() => onRemove(i)} title="Remove slot">✕</button>
        )}
      </div>
    ))}
  </div>
);

const NegotiationPanel = ({ negotiation: initial, role, order, onNegotiationUpdate, onContractCreated }) => {
  const [neg, setNeg] = useState(initial);
  const [editMode, setEditMode] = useState(false);

  // My editable proposals
  const [myTasks, setMyTasks] = useState(
    role === "client" ? (initial?.clientProposedTasks || []) : (initial?.caregiverProposedTasks || [])
  );
  const [mySchedule, setMySchedule] = useState(
    role === "client" ? (initial?.clientProposedSchedule || []) : (initial?.caregiverProposedSchedule || [])
  );
  // Client-owned address fields
  const [serviceAddress, setServiceAddress] = useState(initial?.serviceAddress || "");
  const [accessInstructions, setAccessInstructions] = useState(initial?.accessInstructions || "");
  const [confirmAtServiceAddress, setConfirmAtServiceAddress] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [capturingGps, setCapturingGps] = useState(false);
  const [specialRequirements, setSpecialRequirements] = useState(initial?.specialClientRequirements || "");
  const [additionalNotes, setAdditionalNotes] = useState(initial?.additionalNotes || "");
  const [note, setNote] = useState("");

  // Add-task form
  const [newTask, setNewTask] = useState("");
  // Add-schedule slot form
  const [slotDay, setSlotDay] = useState("Monday");
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("13:00");

  // Loading states
  const [saving, setSaving] = useState(false);
  const [agreeing, setAgreeing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [showAbandon, setShowAbandon] = useState(false);
  const [abandonReason, setAbandonReason] = useState("");

  const status = neg?.status;
  const statusInfo = NegotiationService.getStatusInfo(status);
  const isTerminal = NegotiationService.isTerminal(neg);
  const iCanEdit = NegotiationService.canEdit(neg, role);
  const iAgreed = NegotiationService.hasMyPartyAgreed(neg, role);
  const theyAgreed = role === "client" ? neg?.caregiverAgreed : neg?.clientAgreed;

  const myProposedTasks = role === "client" ? neg?.clientProposedTasks : neg?.caregiverProposedTasks;
  const theirTasks = role === "client" ? neg?.caregiverProposedTasks : neg?.clientProposedTasks;
  const theirSchedule = role === "client" ? neg?.caregiverProposedSchedule : neg?.clientProposedSchedule;
  const myLatestNote = role === "client" ? neg?.lastClientNote : neg?.lastCaregiverNote;
  const theirNote = role === "client" ? neg?.lastCaregiverNote : neg?.lastClientNote;
  const theirLabel = role === "client" ? "Caregiver" : "Client";
  const myLabel = role === "client" ? "You (Client)" : "You (Caregiver)";

  // Sync state when prop changes (parent re-fetches)
  // (simple: parent can unmount/remount if negotiation id changes)

  const update = (newNeg) => {
    setNeg(newNeg);
    if (onNegotiationUpdate) onNegotiationUpdate(newNeg);
  };

  const handleSave = async (submitForReview = false) => {
    setSaving(true);
    let payload;
    if (role === "client") {
      payload = {
        clientProposedTasks: myTasks,
        clientProposedSchedule: mySchedule,
        specialClientRequirements: specialRequirements,
        serviceAddress,
        accessInstructions,
        note: note || undefined,
        submitForCaregiverReview: submitForReview,
      };
      if (confirmAtServiceAddress && gpsCoords) {
        payload.confirmAtServiceAddress = true;
        payload.serviceLatitude = gpsCoords.lat;
        payload.serviceLongitude = gpsCoords.lng;
      } else {
        payload.confirmAtServiceAddress = false;
      }
    } else {
      // Caregiver — cannot send serviceAddress, accessInstructions, or GPS fields
      payload = {
        caregiverProposedTasks: myTasks,
        caregiverProposedSchedule: mySchedule,
        additionalNotes,
        note: note || undefined,
        submitForClientReview: submitForReview,
      };
    }

    const fn = role === "client" ? NegotiationService.clientUpdate : NegotiationService.caregiverUpdate;
    const result = await fn.call(NegotiationService, neg.id, payload);
    if (result.success) {
      update(result.data);
      // Sync my editable fields from response
      setMyTasks(role === "client" ? result.data.clientProposedTasks || [] : result.data.caregiverProposedTasks || []);
      setMySchedule(role === "client" ? result.data.clientProposedSchedule || [] : result.data.caregiverProposedSchedule || []);
      setServiceAddress(result.data.serviceAddress || "");
      setAccessInstructions(result.data.accessInstructions || "");
      setNote("");
      setEditMode(false);
      toast.success(submitForReview ? "Submitted for review!" : "Draft saved.");
    } else {
      toast.error(result.error || "Failed to save.");
    }
    setSaving(false);
  };

  const handleAgree = async () => {
    setAgreeing(true);
    const fn = role === "client" ? NegotiationService.clientAgree : NegotiationService.caregiverAgree;
    const result = await fn.call(NegotiationService, neg.id);
    if (result.success) {
      update(result.data);
      toast.success(result.data.status === "BothAgreed" ? "🎉 Both parties agreed! Contract is ready." : "Agreement noted — waiting for the other party.");
    } else {
      toast.error(result.error || "Failed to agree.");
    }
    setAgreeing(false);
  };

  const handleConvert = async () => {
    // Frontend guard — backend also enforces this
    if (!neg?.serviceAddress) {
      toast.error("Service address is missing. The client must provide it before generating the contract.");
      return;
    }
    setConverting(true);
    const result = await NegotiationService.convertToContract(neg.id);
    if (result.success) {
      update(result.data);
      if (onContractCreated) onContractCreated(result.data.contractId, result.data);
      toast.success("Contract generated and is now active!");
    } else {
      toast.error(result.error || "Failed to generate contract.");
    }
    setConverting(false);
  };

  const handleAbandon = async () => {
    setAbandoning(true);
    const result = await NegotiationService.abandon(neg.id, abandonReason);
    if (result.success) {
      update(result.data);
      setShowAbandon(false);
      toast.info("Negotiation cancelled.");
    } else {
      toast.error(result.error || "Failed to cancel.");
    }
    setAbandoning(false);
  };

  const addTask = () => {
    const t = newTask.trim();
    if (!t) return;
    setMyTasks((prev) => [...prev, t]);
    setNewTask("");
  };

  const removeTask = (i) => setMyTasks((prev) => prev.filter((_, idx) => idx !== i));

  const addSlot = () => {
    if (slotStart >= slotEnd) { toast.error("End time must be after start time."); return; }
    setMySchedule((prev) => [...prev, { dayOfWeek: slotDay, startTime: slotStart, endTime: slotEnd }]);
  };
  const removeSlot = (i) => setMySchedule((prev) => prev.filter((_, idx) => idx !== i));

  // ── Terminal states ────────────────────────────────────────────────────────
  if (status === "Abandoned") {
    return (
      <div className="neg-panel neg-panel--abandoned">
        <div className="neg-status-bar">
          <span className="neg-status-icon">❌</span>
          <span className="neg-status-label">Negotiation Abandoned</span>
        </div>
        {neg.abandonReason && <p className="neg-abandon-reason">Reason: {neg.abandonReason}</p>}
        <p className="neg-hint">Either party can start a new negotiation from the order page.</p>
      </div>
    );
  }

  if (status === "ConvertedToContract") {
    return (
      <div className="neg-panel neg-panel--converted">
        <div className="neg-status-bar">
          <span className="neg-status-icon">📄</span>
          <span className="neg-status-label">Contract Generated</span>
        </div>
        <p className="neg-hint">The negotiation was converted to a formal contract. See the contract section below.</p>
      </div>
    );
  }

  // ── Active states ──────────────────────────────────────────────────────────
  return (
    <div className="neg-panel">
      {/* ── Status bar ── */}
      <div className="neg-status-bar" style={{ borderLeftColor: statusInfo.color }}>
        <span className="neg-status-icon">{statusInfo.icon}</span>
        <div className="neg-status-text">
          <span className="neg-status-label" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
          <span className="neg-status-desc">
            {status === "Drafting" && "Propose your tasks and schedule, then submit for the other party to review."}
            {status === "PendingCaregiverReview" && "Client submitted their proposals. Caregiver needs to review and respond."}
            {status === "PendingClientReview" && "Caregiver submitted their proposals. Client needs to review and respond."}
            {status === "BothAgreed" && "Both parties agreed — click Generate Contract below."}
          </span>
        </div>
        <span className="neg-round-badge">Round {neg?.negotiationRound || 1}</span>
      </div>

      {/* ── Agreement chips ── */}
      <div className="neg-agreement-row">
        <div className={`neg-chip ${neg?.clientAgreed ? "neg-chip--agreed" : ""}`}>
          {neg?.clientAgreed ? "✅" : "⬜"} Client
        </div>
        <div className="neg-chip-divider">+</div>
        <div className={`neg-chip ${neg?.caregiverAgreed ? "neg-chip--agreed" : ""}`}>
          {neg?.caregiverAgreed ? "✅" : "⬜"} Caregiver
        </div>
      </div>

      {/* ── BothAgreed CTA ── */}
      {status === "BothAgreed" && (
        <div className="neg-both-agreed-cta">
          <div className="neg-both-agreed-icon">🎉</div>
          <h3>Both parties agreed!</h3>
          <p>The formal contract can now be generated. It will be immediately active — no further approval needed.</p>

          {/* Agreed summary */}
          {neg?.agreedTasks?.length > 0 && (
            <div className="neg-section" style={{ textAlign: 'left', marginBottom: '12px' }}>
              <div className="neg-section-label">Agreed Tasks</div>
              <TaskList tasks={neg.agreedTasks} editable={false} onRemove={null} />
            </div>
          )}
          {neg?.agreedSchedule?.length > 0 && (
            <div className="neg-section" style={{ textAlign: 'left', marginBottom: '12px' }}>
              <div className="neg-section-label">Agreed Schedule</div>
              <ScheduleList slots={neg.agreedSchedule} editable={false} onRemove={null} />
            </div>
          )}

          {/* Service address summary + warning */}
          <div className="neg-section" style={{ textAlign: 'left', marginBottom: '12px' }}>
            <div className="neg-section-label">Service Address</div>
            {neg?.serviceAddress ? (
              <p className="neg-detail-row">{neg.serviceAddress}</p>
            ) : (
              <p className="neg-detail-row" style={{ color: '#d32f2f', fontWeight: 500 }}>
                ⚠️ Service address is missing. The client must provide it before generating the contract.
              </p>
            )}
            {neg?.accessInstructions && (
              <p className="neg-detail-row"><strong>Access:</strong> {neg.accessInstructions}</p>
            )}
          </div>

          <button className="neg-btn neg-btn--generate" onClick={handleConvert} disabled={converting || !neg?.serviceAddress}>
            {converting ? "Generating…" : "📄 Generate Contract"}
          </button>
          {!neg?.serviceAddress && role === 'client' && (
            <p className="neg-hint" style={{ marginTop: '8px' }}>Click "Edit My Proposals" below to add the service address.</p>
          )}
        </div>
      )}

      {/* ── Two-column proposals ── */}
      <div className="neg-proposals-grid">
        {/* ── My side ── */}
        <div className="neg-col neg-col--mine">
          <div className="neg-col-header">
            <span className="neg-col-title">{myLabel}</span>
            {iAgreed && <span className="neg-agreed-badge">✅ You agreed</span>}
          </div>

          {/* Tasks */}
          <div className="neg-section">
            <div className="neg-section-label">Tasks</div>
            {myTasks.length === 0 && !editMode && (
              <p className="neg-empty">No tasks proposed yet.</p>
            )}
            {editMode ? (
              <>
                <TaskList tasks={myTasks} editable onRemove={removeTask} />
                <div className="neg-add-row">
                  <input
                    className="neg-input"
                    type="text"
                    placeholder="Add a task and press Enter…"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                  />
                  <button className="neg-btn neg-btn--sm" onClick={addTask}>Add</button>
                </div>
              </>
            ) : (
              <TaskList tasks={myTasks} editable={false} onRemove={null} />
            )}
          </div>

          {/* Schedule */}
          <div className="neg-section">
            <div className="neg-section-label">Schedule</div>
            {mySchedule.length === 0 && !editMode && (
              <p className="neg-empty">No schedule proposed yet.</p>
            )}
            {editMode ? (
              <>
                <ScheduleList slots={mySchedule} editable onRemove={removeSlot} />
                <div className="neg-add-slot-form">
                  <select className="neg-select" value={slotDay} onChange={(e) => setSlotDay(e.target.value)}>
                    {DAYS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  <input className="neg-input neg-input--time" type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
                  <span className="neg-time-sep">to</span>
                  <input className="neg-input neg-input--time" type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
                  <button className="neg-btn neg-btn--sm" onClick={addSlot}>Add</button>
                </div>
              </>
            ) : (
              <ScheduleList slots={mySchedule} editable={false} onRemove={null} />
            )}
          </div>

          {/* Service details — EDIT MODE */}
          {editMode && (
            <div className="neg-section">
              <div className="neg-section-label">Service Details</div>

              {role === "client" ? (
                <>
                  <label className="neg-label">Service Address</label>
                  <input
                    className="neg-input"
                    type="text"
                    value={serviceAddress}
                    onChange={(e) => setServiceAddress(e.target.value)}
                    placeholder="e.g. 12 Adeola Odeku, Victoria Island, Lagos"
                  />
                  {/* GPS toggle — client can confirm they are at the service address */}
                  <div className="neg-gps-toggle" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                    <input
                      type="checkbox"
                      id="neg-gps-toggle"
                      checked={confirmAtServiceAddress}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setConfirmAtServiceAddress(checked);
                        if (checked && navigator.geolocation) {
                          setCapturingGps(true);
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                              setCapturingGps(false);
                            },
                            () => {
                              toast.error("Unable to capture GPS location. Please allow location access.");
                              setConfirmAtServiceAddress(false);
                              setCapturingGps(false);
                            }
                          );
                        } else if (!checked) {
                          setGpsCoords(null);
                        }
                      }}
                    />
                    <label htmlFor="neg-gps-toggle" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>
                      {capturingGps ? 'Capturing GPS…' : 'I am currently at this address'}
                    </label>
                  </div>
                  {gpsCoords && (
                    <p style={{ fontSize: '12px', color: '#888', margin: '0 0 8px' }}>
                      📍 GPS captured ({gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)})
                    </p>
                  )}

                  <label className="neg-label">Access Instructions</label>
                  <textarea
                    className="neg-textarea"
                    rows="2"
                    value={accessInstructions}
                    onChange={(e) => setAccessInstructions(e.target.value)}
                    placeholder="e.g. Ring buzzer 4B, use side gate"
                  />
                  <label className="neg-label">Special Requirements</label>
                  <textarea
                    className="neg-textarea"
                    rows="2"
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    placeholder="e.g. Patient has mobility issues, prefers morning sessions"
                  />
                </>
              ) : (
                /* Caregiver — address is read-only */
                <>
                  {neg?.serviceAddress ? (
                    <p className="neg-detail-row"><strong>Address (set by client):</strong> {neg.serviceAddress}</p>
                  ) : (
                    <p className="neg-detail-row" style={{ color: '#888', fontStyle: 'italic' }}>
                      The client will provide the service address.
                    </p>
                  )}
                  {neg?.accessInstructions && (
                    <p className="neg-detail-row"><strong>Access:</strong> {neg.accessInstructions}</p>
                  )}
                </>
              )}

              <label className="neg-label">Additional Notes</label>
              <textarea
                className="neg-textarea"
                rows="2"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any other information…"
              />
              <label className="neg-label">Message to {theirLabel}</label>
              <textarea
                className="neg-textarea"
                rows="2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note explaining your changes…"
              />
            </div>
          )}

          {/* Static service detail display when not editing */}
          {!editMode && (neg?.serviceAddress || neg?.accessInstructions || neg?.specialClientRequirements || neg?.additionalNotes) && (
            <div className="neg-section">
              <div className="neg-section-label">Service Details</div>
              {neg.serviceAddress && <p className="neg-detail-row"><strong>Address:</strong> {neg.serviceAddress}</p>}
              {neg.accessInstructions && <p className="neg-detail-row"><strong>Access:</strong> {neg.accessInstructions}</p>}
              {neg.specialClientRequirements && <p className="neg-detail-row"><strong>Requirements:</strong> {neg.specialClientRequirements}</p>}
              {neg.additionalNotes && <p className="neg-detail-row"><strong>Notes:</strong> {neg.additionalNotes}</p>}
            </div>
          )}
          {/* Prompt client to add address if missing */}
          {!editMode && !neg?.serviceAddress && role === "client" && !isTerminal && (
            <div className="neg-section">
              <p className="neg-detail-row" style={{ color: '#d32f2f', fontWeight: 500, fontSize: '13px' }}>
                ⚠️ You must provide the service address before the contract can be generated.
              </p>
            </div>
          )}

          {/* My last message */}
          {!editMode && myLatestNote && (
            <div className="neg-note neg-note--mine">
              <span className="neg-note-label">Your last message:</span>
              <span className="neg-note-text">"{myLatestNote}"</span>
            </div>
          )}

          {/* Actions */}
          <div className="neg-col-actions">
            {!editMode && iCanEdit && !isTerminal && (
              <button className="neg-btn neg-btn--edit" onClick={() => setEditMode(true)}>
                ✏️ Edit My Proposals
              </button>
            )}
            {editMode && (
              <>
                <button className="neg-btn neg-btn--save" onClick={() => handleSave(false)} disabled={saving}>
                  {saving ? "Saving…" : "Save Draft"}
                </button>
                <button className="neg-btn neg-btn--submit" onClick={() => handleSave(true)} disabled={saving}>
                  {saving ? "Submitting…" : `Submit for ${theirLabel} Review`}
                </button>
                <button className="neg-btn neg-btn--ghost" onClick={() => setEditMode(false)}>Cancel</button>
              </>
            )}
            {!editMode && !isTerminal && !iAgreed && (
              <button className="neg-btn neg-btn--agree" onClick={handleAgree} disabled={agreeing}>
                {agreeing ? "Processing…" : "✅ I Agree to These Terms"}
              </button>
            )}
            {!editMode && iAgreed && status !== "BothAgreed" && (
              <p className="neg-agreed-waiting">✅ You agreed — waiting for {theirLabel} to agree</p>
            )}
          </div>
        </div>

        {/* ── Their side ── */}
        <div className="neg-col neg-col--theirs">
          <div className="neg-col-header">
            <span className="neg-col-title">{theirLabel}'s Proposals</span>
            {theyAgreed && <span className="neg-agreed-badge">✅ They agreed</span>}
          </div>

          {/* Their tasks */}
          <div className="neg-section">
            <div className="neg-section-label">Tasks</div>
            {!theirTasks || theirTasks.length === 0 ? (
              <p className="neg-empty">No tasks proposed yet.</p>
            ) : (
              <TaskList tasks={theirTasks} editable={false} onRemove={null} />
            )}
          </div>

          {/* Their schedule */}
          <div className="neg-section">
            <div className="neg-section-label">Schedule</div>
            {!theirSchedule || theirSchedule.length === 0 ? (
              <p className="neg-empty">No schedule proposed yet.</p>
            ) : (
              <ScheduleList slots={theirSchedule} editable={false} onRemove={null} />
            )}
          </div>

          {/* Their note */}
          {theirNote && (
            <div className="neg-note neg-note--theirs">
              <span className="neg-note-label">{theirLabel}'s message:</span>
              <span className="neg-note-text">"{theirNote}"</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Abandon section ── */}
      {!isTerminal && (
        <div className="neg-abandon-section">
          {!showAbandon ? (
            <button className="neg-btn neg-btn--ghost neg-btn--danger-ghost" onClick={() => setShowAbandon(true)}>
              Cancel Negotiation
            </button>
          ) : (
            <div className="neg-abandon-form">
              <p className="neg-abandon-warning">Are you sure you want to cancel this negotiation?</p>
              <input
                className="neg-input"
                type="text"
                placeholder="Reason (optional)"
                value={abandonReason}
                onChange={(e) => setAbandonReason(e.target.value)}
              />
              <div className="neg-abandon-actions">
                <button className="neg-btn neg-btn--danger" onClick={handleAbandon} disabled={abandoning}>
                  {abandoning ? "Cancelling…" : "Confirm Cancel"}
                </button>
                <button className="neg-btn neg-btn--ghost" onClick={() => setShowAbandon(false)}>Back</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NegotiationPanel;
