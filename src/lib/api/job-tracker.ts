import { ApiError, friendlyApiMessage } from "@/lib/api/api-error";

function resolveApiUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw !== undefined && raw !== "") return raw.replace(/\/$/, "");
  const fallback = import.meta.env.PROD ? "/api" : "http://localhost:8080/api";
  return fallback.replace(/\/$/, "");
}

const API_URL = resolveApiUrl();

function extractErrorMessage(data: Record<string, unknown>): string {
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  return "";
}

export type JobStatus =
  | "saved"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "ghosted"
  | "withdrawn";

export type WorkType = "remote" | "hybrid" | "onsite" | "unknown";

export type JobPlatform = "manual" | "linkedin" | "glints" | "jobstreet" | "career_page" | "rss" | "other";

export type JobApplication = {
  id: number;
  user_id: number;
  company_id: number | null;
  company_name: string;
  role_title: string;
  job_url: string | null;
  source_platform: JobPlatform;
  location: string | null;
  work_type: WorkType;
  status: JobStatus;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  applied_at: string | null;
  deadline_at: string | null;
  excitement_score: number | null;
  notes: string | null;
  job_description: string | null;
  tags: string[];
  priority: number;
  primary_contact_id: number | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
};

export type JobInterviewRound = {
  id: number;
  application_id: number;
  title: string;
  round_type: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meeting_url: string | null;
  location: string | null;
  status: string;
  outcome: string;
  interviewer: string | null;
  feedback: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type JobApplicationEvent = {
  id: number;
  application_id: number;
  event_type: string;
  title: string;
  body: string | null;
  occurred_at: string;
  created_at: string;
};

export type JobOffer = {
  id: number;
  application_id: number;
  base_salary: number | null;
  bonus: number | null;
  equity: string | null;
  currency: string;
  benefits: string | null;
  start_date: string | null;
  response_deadline: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type JobApplicationWithRounds = JobApplication & {
  rounds: JobInterviewRound[];
  events?: JobApplicationEvent[];
  offer?: JobOffer | null;
};

export type JobCompany = {
  id: number;
  user_id: number;
  name: string;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  hq_location: string | null;
  description: string | null;
  linkedin_url: string | null;
  careers_url: string | null;
  address_line: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  logo_url: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
};

export type JobContact = {
  id: number;
  user_id: number;
  company_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  role_title: string | null;
  linkedin_url: string | null;
  channel: string;
  source: string;
  source_application_id: number | null;
  is_hiring_contact: boolean;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type JobThreadMessage = {
  id: number;
  thread_id: number;
  direction: string;
  sender_name: string | null;
  sender_email: string | null;
  body: string;
  sent_at: string;
  is_read: boolean;
  created_at: string;
};

export type JobThread = {
  id: number;
  user_id: number;
  application_id: number | null;
  contact_id: number | null;
  company_id: number | null;
  subject: string;
  channel: string;
  status: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  messages: JobThreadMessage[];
};

export type JobIngestionSource = {
  id: number;
  user_id: number;
  name: string;
  platform: string;
  source_url: string;
  config: Record<string, unknown>;
  enabled: boolean;
  poll_interval_hours: number;
  last_polled_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  items_found_total: number;
  created_at: string;
  updated_at: string;
};

export type IngestionItemContact = {
  name: string;
  email?: string;
  phone?: string;
  role_title?: string;
  linkedin_url?: string;
  channel?: string;
  is_hiring_contact?: boolean;
};

export type JobIngestionItem = {
  id: number;
  user_id: number;
  source_id: number | null;
  title: string;
  company_name: string | null;
  location: string | null;
  job_url: string;
  salary_text: string | null;
  description_snippet: string | null;
  description_full: string | null;
  company_website: string | null;
  platform: string;
  status: string;
  application_id: number | null;
  discovered_at: string;
  contacts?: IngestionItemContact[];
};

export type JobReminder = {
  id: number;
  user_id: number;
  application_id: number | null;
  title: string;
  remind_at: string;
  channel: string;
  is_done: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type JobTrackerStats = {
  total: number;
  active: number;
  offers: number;
  rejected: number;
  upcoming: number;
  by_status: Partial<Record<JobStatus, number>>;
  companies: number;
  contacts: number;
  pending_feed: number;
};

export type JobTrackerOverview = {
  applications: JobApplicationWithRounds[];
  companies: JobCompany[];
  contacts: JobContact[];
  threads: JobThread[];
  sources: JobIngestionSource[];
  ingestion_items: JobIngestionItem[];
  reminders: JobReminder[];
  stats: JobTrackerStats;
};

export type ParsedJobURL = {
  Title?: string;
  CompanyName?: string;
  Location?: string;
  JobURL?: string;
  SalaryText?: string;
  DescriptionSnippet?: string;
  Platform?: string;
  CompanyLogo?: string;
  Contacts?: {
    Name: string;
    Email: string;
    LinkedInURL: string;
    RoleTitle: string;
    Channel: string;
    IsHiringContact: boolean;
  }[];
  title?: string;
  company_name?: string;
  location?: string;
  job_url?: string;
  salary_text?: string;
  description_snippet?: string;
  platform?: string;
};

async function request<T>(path: string, token: string, options: { method?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok) {
    throw new ApiError(friendlyApiMessage(res.status, extractErrorMessage(data)), res.status);
  }
  return data as T;
}

export const jobTrackerApi = {
  overview(token: string) {
    return request<JobTrackerOverview>("/job-tracker/overview", token);
  },
  createApplication(token: string, body: Partial<JobApplication> & { company_name: string; role_title: string }) {
    return request<{ application: JobApplicationWithRounds }>("/job-tracker/applications", token, {
      method: "POST",
      body,
    }).then((r) => r.application);
  },
  updateApplication(token: string, id: number, body: Partial<JobApplication>) {
    return request<{ application: JobApplicationWithRounds }>(`/job-tracker/applications/${id}`, token, {
      method: "PATCH",
      body,
    }).then((r) => r.application);
  },
  deleteApplication(token: string, id: number) {
    return request<{ ok: boolean }>(`/job-tracker/applications/${id}`, token, { method: "DELETE" });
  },
  createRound(token: string, applicationId: number, body: Partial<JobInterviewRound> & { title: string }) {
    return request<{ round: JobInterviewRound }>(`/job-tracker/applications/${applicationId}/rounds`, token, {
      method: "POST",
      body,
    }).then((r) => r.round);
  },
  updateRound(token: string, roundId: number, body: Partial<JobInterviewRound>) {
    return request<{ round: JobInterviewRound }>(`/job-tracker/rounds/${roundId}`, token, {
      method: "PATCH",
      body,
    }).then((r) => r.round);
  },
  deleteRound(token: string, roundId: number) {
    return request<{ ok: boolean }>(`/job-tracker/rounds/${roundId}`, token, { method: "DELETE" });
  },
  createEvent(token: string, applicationId: number, body: { title: string; body?: string; event_type?: string }) {
    return request<{ event: JobApplicationEvent }>(`/job-tracker/applications/${applicationId}/events`, token, {
      method: "POST",
      body,
    }).then((r) => r.event);
  },
  createCompany(token: string, body: Partial<JobCompany> & { name: string }) {
    return request<{ company: JobCompany }>("/job-tracker/companies", token, { method: "POST", body }).then(
      (r) => r.company,
    );
  },
  updateCompany(token: string, id: number, body: Partial<JobCompany>) {
    return request<{ company: JobCompany }>(`/job-tracker/companies/${id}`, token, {
      method: "PATCH",
      body,
    }).then((r) => r.company);
  },
  deleteCompany(token: string, id: number) {
    return request<{ ok: boolean }>(`/job-tracker/companies/${id}`, token, { method: "DELETE" });
  },
  enrichCompany(token: string, id: number) {
    return request<{ company: JobCompany }>(`/job-tracker/companies/${id}/enrich`, token, { method: "POST" }).then(
      (r) => r.company,
    );
  },
  discoverContacts(token: string, applicationId: number) {
    return request<{ contacts: JobContact[] }>(`/job-tracker/applications/${applicationId}/discover-contacts`, token, {
      method: "POST",
    }).then((r) => r.contacts);
  },
  saveLinkedInContact(token: string, profileUrl: string, companyId?: number) {
    return request<{ contact: JobContact }>("/job-tracker/contacts/from-linkedin", token, {
      method: "POST",
      body: { profile_url: profileUrl, company_id: companyId },
    }).then((r) => r.contact);
  },
  createContact(token: string, body: Partial<JobContact> & { name: string }) {
    return request<{ contact: JobContact }>("/job-tracker/contacts", token, { method: "POST", body }).then(
      (r) => r.contact,
    );
  },
  updateContact(token: string, id: number, body: Partial<JobContact>) {
    return request<{ contact: JobContact }>(`/job-tracker/contacts/${id}`, token, {
      method: "PATCH",
      body,
    }).then((r) => r.contact);
  },
  deleteContact(token: string, id: number) {
    return request<{ ok: boolean }>(`/job-tracker/contacts/${id}`, token, { method: "DELETE" });
  },
  createThread(token: string, body: { subject: string; channel?: string; application_id?: number }) {
    return request<{ thread: JobThread }>("/job-tracker/threads", token, { method: "POST", body }).then(
      (r) => r.thread,
    );
  },
  createThreadMessage(
    token: string,
    threadId: number,
    body: { body: string; direction?: string; sender_name?: string },
  ) {
    return request<{ message: JobThreadMessage }>(`/job-tracker/threads/${threadId}/messages`, token, {
      method: "POST",
      body,
    }).then((r) => r.message);
  },
  createOffer(token: string, body: Partial<JobOffer> & { application_id: number }) {
    return request<{ offer: JobOffer }>("/job-tracker/offers", token, { method: "POST", body }).then((r) => r.offer);
  },
  updateOffer(token: string, id: number, body: Partial<JobOffer>) {
    return request<{ offer: JobOffer }>(`/job-tracker/offers/${id}`, token, { method: "PATCH", body }).then(
      (r) => r.offer,
    );
  },
  deleteOffer(token: string, id: number) {
    return request<{ ok: boolean }>(`/job-tracker/offers/${id}`, token, { method: "DELETE" });
  },
  createReminder(token: string, body: { title: string; remind_at: string; application_id?: number }) {
    return request<{ reminder: JobReminder }>("/job-tracker/reminders", token, { method: "POST", body }).then(
      (r) => r.reminder,
    );
  },
  updateReminder(token: string, id: number, body: Partial<JobReminder> & { is_done?: boolean }) {
    return request<{ reminder: JobReminder }>(`/job-tracker/reminders/${id}`, token, {
      method: "PATCH",
      body,
    }).then((r) => r.reminder);
  },
  deleteReminder(token: string, id: number) {
    return request<{ ok: boolean }>(`/job-tracker/reminders/${id}`, token, { method: "DELETE" });
  },
  createSource(
    token: string,
    body: {
      name: string;
      platform: string;
      source_url: string;
      poll_interval_hours?: number;
      config?: Record<string, string | number | boolean>;
    },
  ) {
    return request<{ source: JobIngestionSource }>("/job-tracker/ingestion/sources", token, {
      method: "POST",
      body,
    }).then((r) => r.source);
  },
  updateSource(token: string, id: number, body: Partial<JobIngestionSource>) {
    return request<{ source: JobIngestionSource }>(`/job-tracker/ingestion/sources/${id}`, token, {
      method: "PATCH",
      body,
    }).then((r) => r.source);
  },
  deleteSource(token: string, id: number) {
    return request<{ ok: boolean }>(`/job-tracker/ingestion/sources/${id}`, token, { method: "DELETE" });
  },
  runSource(token: string, id: number) {
    return request<{ run: { items_found: number; items_new: number; status: string }; warning?: string }>(
      `/job-tracker/ingestion/sources/${id}/run`,
      token,
      { method: "POST" },
    );
  },
  ingestionItemAction(token: string, id: number, action: "import" | "ignore" | "dismiss") {
    return request<{ application?: JobApplication; item?: JobIngestionItem }>(
      `/job-tracker/ingestion/items/${id}`,
      token,
      { method: "PATCH", body: { action } },
    );
  },
  parseURL(token: string, url: string) {
    return request<{ job: ParsedJobURL }>("/job-tracker/ingest/url", token, {
      method: "POST",
      body: { url },
    }).then((r) => r.job);
  },
};
