import { Router, type IRouter } from "express";
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

type Urgency = "emergency" | "soon" | "general";
type Status = "new" | "under_review" | "referred" | "resolved" | "closed";
type Source = "digital" | "physical_dropbox";

type CaseNote = {
  id: string;
  authorName: string;
  note: string;
  visibleToPnp: boolean;
  createdAt: string;
};

type Report = {
  id: string;
  trackingCode: string;
  isAnonymous: boolean;
  reporterContact: string | null;
  description: string;
  peopleInvolved: string | null;
  incidentDatetime: string | null;
  urgency: Urgency;
  status: Status;
  source: Source;
  escalatedToPnp: boolean;
  createdAt: string;
  updatedAt: string;
  notes: CaseNote[];
};

const now = new Date();
const hoursAgo = (hours: number) =>
  new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

const reports: Report[] = [
  {
    id: "rpt-001",
    trackingCode: "DCPC-7K4M2Q",
    isAnonymous: true,
    reporterContact: null,
    description:
      "A younger student has been waiting alone near the covered court after dismissal. An older group keeps approaching them and taking their things.",
    peopleInvolved: "Younger student; group of older students",
    incidentDatetime: "This week, after school",
    urgency: "soon",
    status: "under_review",
    source: "digital",
    escalatedToPnp: false,
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(1),
    notes: [
      {
        id: "note-001",
        authorName: "M. Santos",
        note: "Checking with the school focal person before referral.",
        visibleToPnp: false,
        createdAt: hoursAgo(1),
      },
    ],
  },
  {
    id: "rpt-002",
    trackingCode: "DCPC-9P1H8N",
    isAnonymous: false,
    reporterContact: "parent-rep@example.org",
    description:
      "A child disclosed repeated shouting and hitting at home. The family may need immediate safety planning and referral.",
    peopleInvolved: "Child and adult household member",
    incidentDatetime: "Last night",
    urgency: "emergency",
    status: "referred",
    source: "physical_dropbox",
    escalatedToPnp: true,
    createdAt: hoursAgo(18),
    updatedAt: hoursAgo(2),
    notes: [
      {
        id: "note-002",
        authorName: "E.J. Dela Cruz",
        note: "Escalated to PNP WCPD for immediate safety coordination.",
        visibleToPnp: true,
        createdAt: hoursAgo(2),
      },
    ],
  },
  {
    id: "rpt-003",
    trackingCode: "DCPC-3B6T5X",
    isAnonymous: true,
    reporterContact: null,
    description:
      "There is no safe place to wait for some students during heavy rain near the barangay hall.",
    peopleInvolved: null,
    incidentDatetime: "Ongoing",
    urgency: "general",
    status: "new",
    source: "digital",
    escalatedToPnp: false,
    createdAt: hoursAgo(28),
    updatedAt: hoursAgo(28),
    notes: [],
  },
];

const feedback: Array<{ comfortRating: number; comments: string | null }> = [];

const makeTrackingCode = () =>
  `DCPC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const publicMessage = (status: Status) => {
  if (status === "new") return "Your signal is in the queue and has not been opened yet.";
  if (status === "under_review") return "A DCPC team member is reviewing your signal.";
  if (status === "referred") return "Your signal has been referred to the people who can help.";
  if (status === "resolved") return "The team has marked this signal as resolved.";
  return "This signal has been closed. You can send a new report if you still need help.";
};

const router: IRouter = Router();

router.get("/reports", (_req, res) => {
  res.json(
    [...reports].sort((a, b) => {
      const urgencyOrder = { emergency: 0, soon: 1, general: 2 };
      return (
        urgencyOrder[a.urgency] - urgencyOrder[b.urgency] ||
        Date.parse(b.createdAt) - Date.parse(a.createdAt)
      );
    }),
  );
});

router.post("/reports", (req, res) => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the report details and try again." });
    return;
  }
  const input = parsed.data;
  const createdAt = new Date().toISOString();
  const report: Report = {
    id: makeId("rpt"),
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
    createdAt,
    updatedAt: createdAt,
    notes: [],
  };
  reports.unshift(report);
  res.status(201).json({
    trackingCode: report.trackingCode,
    message: "Your report was received. Keep this code somewhere safe.",
  });
});

router.get("/reports/:trackingCode", (req, res) => {
  const parsed = GetReportByTrackingCodeParams.safeParse(req.params);
  const report = reports.find((item) => item.trackingCode === parsed.data?.trackingCode);
  if (!parsed.success || !report) {
    res.status(404).json({ error: "We could not find a report with that code." });
    return;
  }
  res.json({
    trackingCode: report.trackingCode,
    status: report.status,
    urgency: report.urgency,
    createdAt: report.createdAt,
    lastUpdatedAt: report.updatedAt,
    publicMessage: publicMessage(report.status),
  });
});

router.patch("/reports/:reportId/status", (req, res) => {
  const params = UpdateReportStatusParams.safeParse(req.params);
  const body = UpdateReportStatusBody.safeParse(req.body);
  const report = reports.find((item) => item.id === params.data?.reportId);
  if (!params.success || !body.success || !report) {
    res.status(400).json({ error: "We could not update this report." });
    return;
  }
  report.status = body.data.status;
  report.updatedAt = new Date().toISOString();
  res.json(report);
});

router.post("/reports/:reportId/escalate", (req, res) => {
  const params = EscalateReportParams.safeParse(req.params);
  const report = reports.find((item) => item.id === params.data?.reportId);
  if (!params.success || !report) {
    res.status(404).json({ error: "We could not find this report." });
    return;
  }
  report.escalatedToPnp = true;
  report.updatedAt = new Date().toISOString();
  res.json(report);
});

router.post("/reports/:reportId/notes", (req, res) => {
  const params = AddCaseNoteParams.safeParse(req.params);
  const body = AddCaseNoteBody.safeParse(req.body);
  const report = reports.find((item) => item.id === params.data?.reportId);
  if (!params.success || !body.success || !report) {
    res.status(400).json({ error: "Please write a note before saving." });
    return;
  }
  const note: CaseNote = {
    id: makeId("note"),
    authorName: "DCPC Officer",
    note: body.data.note,
    visibleToPnp: body.data.visibleToPnp,
    createdAt: new Date().toISOString(),
  };
  report.notes.push(note);
  report.updatedAt = note.createdAt;
  res.status(201).json(note);
});

router.post("/feedback", (req, res) => {
  const parsed = CreateFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please choose a comfort rating." });
    return;
  }
  feedback.push({
    comfortRating: parsed.data.comfortRating,
    comments: parsed.data.comments ?? null,
  });
  res.status(201).json({ message: "Thank you. Your feedback was received anonymously." });
});

router.get("/oversight/stats", (_req, res) => {
  const resolved = reports.filter((report) => report.status === "resolved" || report.status === "closed").length;
  const monthMap = new Map<string, { reports: number; resolved: number }>();
  reports.forEach((report) => {
    const month = new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(report.createdAt));
    const current = monthMap.get(month) ?? { reports: 0, resolved: 0 };
    current.reports += 1;
    if (report.status === "resolved" || report.status === "closed") current.resolved += 1;
    monthMap.set(month, current);
  });
  res.json({
    totalReports: reports.length,
    urgentReports: reports.filter((report) => report.urgency !== "general").length,
    resolutionRate: reports.length ? Math.round((resolved / reports.length) * 100) : 0,
    averageResponseHours: 18.5,
    monthly: [...monthMap.entries()].map(([month, values]) => ({ month, ...values })),
    categories: [
      { label: "Safety at home", value: 8 },
      { label: "Peer conflict", value: 5 },
      { label: "Safe spaces", value: 3 },
      { label: "Other", value: Math.max(0, reports.length - 16) },
    ],
  });
});

export default router;