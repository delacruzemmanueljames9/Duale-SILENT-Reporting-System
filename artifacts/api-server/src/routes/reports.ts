import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, reportsTable, caseNotesTable, feedbackTable } from "@workspace/db";
import {
  AddCaseNoteBody,
  AddCaseNoteParams,
  CreateFeedbackBody,
  CreateReportBody,
  EscalateReportParams,
  GetReportByTrackingCodeParams,
  UpdateReportStatusBody,
  UpdateReportStatusParams,
} from "@workspace/api-zod";

const makeTrackingCode = () =>
  `DCPC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const publicMessage = (status: string) => {
  if (status === "new") return "Your signal is in the queue and has not been opened yet.";
  if (status === "under_review") return "A DCPC team member is reviewing your signal.";
  if (status === "referred") return "Your signal has been referred to the people who can help.";
  if (status === "resolved") return "The team has marked this signal as resolved.";
  return "This signal has been closed. You can send a new report if you still need help.";
};

const attachNotes = async (report: typeof reportsTable.$inferSelect) => {
  const notes = await db
    .select()
    .from(caseNotesTable)
    .where(eq(caseNotesTable.reportId, report.id))
    .orderBy(caseNotesTable.createdAt);
  return {
    ...report,
    notes: notes.map((n) => ({
      id: n.id,
      authorName: n.authorName,
      note: n.note,
      visibleToPnp: n.visibleToPnp,
      createdAt: n.createdAt.toISOString(),
    })),
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
};

const router: IRouter = Router();

router.get("/reports", async (_req, res) => {
  const rows = await db.select().from(reportsTable).orderBy(desc(reportsTable.createdAt));
  const withNotes = await Promise.all(rows.map(attachNotes));
  const urgencyOrder: Record<string, number> = { emergency: 0, soon: 1, general: 2 };
  withNotes.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  res.json(withNotes);
});

router.post("/reports", async (req, res) => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the report details and try again." });
    return;
  }
  const input = parsed.data;
  const [report] = await db
    .insert(reportsTable)
    .values({
      trackingCode: makeTrackingCode(),
      isAnonymous: input.isAnonymous,
      reporterContact: input.isAnonymous ? null : input.reporterContact ?? null,
      description: input.description,
      peopleInvolved: input.peopleInvolved ?? null,
      incidentDatetime: input.incidentDatetime ?? null,
      urgency: input.urgency,
      status: "new",
      source: input.source,
      escalatedToPnp: input.urgency === "emergency",
    })
    .returning();
  res.status(201).json({
    trackingCode: report.trackingCode,
    message: "Your report was received. Keep this code somewhere safe.",
  });
});

router.get("/reports/:trackingCode", async (req, res) => {
  const parsed = GetReportByTrackingCodeParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "We could not find a report with that code." });
    return;
  }
  const [report] = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.trackingCode, parsed.data.trackingCode))
    .limit(1);
  if (!report) {
    res.status(404).json({ error: "We could not find a report with that code." });
    return;
  }
  res.json({
    trackingCode: report.trackingCode,
    status: report.status,
    urgency: report.urgency,
    createdAt: report.createdAt.toISOString(),
    lastUpdatedAt: report.updatedAt.toISOString(),
    publicMessage: publicMessage(report.status),
  });
});

router.patch("/reports/:reportId/status", async (req, res) => {
  const params = UpdateReportStatusParams.safeParse(req.params);
  const body = UpdateReportStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "We could not update this report." });
    return;
  }
  const [report] = await db
    .update(reportsTable)
    .set({ status: body.data.status, updatedAt: new Date() })
    .where(eq(reportsTable.id, params.data.reportId))
    .returning();
  if (!report) {
    res.status(404).json({ error: "We could not find this report." });
    return;
  }
  res.json(await attachNotes(report));
});

router.post("/reports/:reportId/escalate", async (req, res) => {
  const params = EscalateReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "We could not find this report." });
    return;
  }
  const [report] = await db
    .update(reportsTable)
    .set({ escalatedToPnp: true, updatedAt: new Date() })
    .where(eq(reportsTable.id, params.data.reportId))
    .returning();
  if (!report) {
    res.status(404).json({ error: "We could not find this report." });
    return;
  }
  res.json(await attachNotes(report));
});

router.post("/reports/:reportId/notes", async (req, res) => {
  const params = AddCaseNoteParams.safeParse(req.params);
  const body = AddCaseNoteBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Please write a note before saving." });
    return;
  }
  const [note] = await db
    .insert(caseNotesTable)
    .values({
      reportId: params.data.reportId,
      authorName: "DCPC Officer",
      note: body.data.note,
      visibleToPnp: body.data.visibleToPnp,
    })
    .returning();
  await db
    .update(reportsTable)
    .set({ updatedAt: new Date() })
    .where(eq(reportsTable.id, params.data.reportId));
  res.status(201).json({
    id: note.id,
    authorName: note.authorName,
    note: note.note,
    visibleToPnp: note.visibleToPnp,
    createdAt: note.createdAt.toISOString(),
  });
});

router.post("/feedback", async (req, res) => {
  const parsed = CreateFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please choose a comfort rating." });
    return;
  }
  await db.insert(feedbackTable).values({
    comfortRating: parsed.data.comfortRating,
    comments: parsed.data.comments ?? null,
  });
  res.status(201).json({ message: "Thank you. Your feedback was received anonymously." });
});

router.get("/oversight/stats", async (_req, res) => {
  const rows = await db.select().from(reportsTable);
  const resolved = rows.filter((r) => r.status === "resolved" || r.status === "closed").length;
  const monthMap = new Map<string, { reports: number; resolved: number }>();
  rows.forEach((report) => {
    const month = new Intl.DateTimeFormat("en", { month: "short" }).format(report.createdAt);
    const current = monthMap.get(month) ?? { reports: 0, resolved: 0 };
    current.reports += 1;
    if (report.status === "resolved" || report.status === "closed") current.resolved += 1;
    monthMap.set(month, current);
  });
  res.json({
    totalReports: rows.length,
    urgentReports: rows.filter((r) => r.urgency !== "general").length,
    resolutionRate: rows.length ? Math.round((resolved / rows.length) * 100) : 0,
    averageResponseHours: 18.5,
    monthly: [...monthMap.entries()].map(([month, values]) => ({ month, ...values })),
    categories: [
      { label: "Safety at home", value: 8 },
      { label: "Peer conflict", value: 5 },
      { label: "Safe spaces", value: 3 },
      { label: "Other", value: Math.max(0, rows.length - 16) },
    ],
  });
});

export default router;
