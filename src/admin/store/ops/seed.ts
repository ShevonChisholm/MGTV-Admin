import type { Activity, AdminUser, Advertiser, Award, Campaign, OpsEvent, Notification, Report, Settings, Sponsor, Template } from "./types"

const iso = (d: number) => new Date(Date.now() + d * 86400000).toISOString()
const pad = (n: number) => String(n).padStart(2, "0")
/** datetime-local string, d days from now at a fixed hour */
export const dl = (d: number, h = 19) => {
  const x = new Date(Date.now() + d * 86400000)
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(h)}:00`
}
export const dateOnly = (d: number) => dl(d).slice(0, 10)

let n = 0
const act = (action: string, daysAgo: number, actor = "Jordan Rivera", reason?: string): Activity => ({ id: `seed_act_${++n}`, at: iso(-daysAgo), actor, action, reason })
const contact = (id: string, name: string, role: string, email: string) => ({ id, name, role, email, phone: "" })

export const seedSponsors: Sponsor[] = [
  {
    id: "spo_northwind", name: "Northwind Audio", status: "active", website: "https://example.com/northwind",
    description: "Audio equipment partner for music programming and live sessions.",
    contacts: [contact("c1", "Mara Ellison", "Partnerships lead", "mara@northwind.example"), contact("c2", "Dev Okafor", "Brand manager", "dev@northwind.example")],
    brandAssets: [{ id: "ba1", label: "Primary logo", kind: "Logo (dark background)", mediaId: "med_img_cover" }],
    showIds: ["shw_nightshift"], eventIds: ["evt_ops_rooftop"], createdAt: iso(-60),
    activity: [act("Associated with Night Shift", 12), act("Added brand asset Primary logo", 20), act("Created organization", 60)],
  },
  {
    id: "spo_harborbank", name: "Harbor Credit Union", status: "inactive", website: "https://example.com/harbor",
    description: "Community partner for documentary programming. Currently paused.",
    contacts: [contact("c3", "Lena Voss", "Community programs", "lena@harbor.example")],
    brandAssets: [], showIds: [], eventIds: [], createdAt: iso(-90),
    activity: [act("Set inactive", 15, "Priya Nair", "Partnership paused until next season planning."), act("Created organization", 90)],
  },
]

export const seedAdvertisers: Advertiser[] = [
  {
    id: "adv_lumen", name: "Lumen Footwear", website: "https://example.com/lumen", notes: "Prefers landscape creative. Reviews copy by email.", status: "active",
    contacts: [contact("c4", "Tomas Reyes", "Media planner", "tomas@lumen.example")], createdAt: iso(-45), activity: [act("Created advertiser", 45)],
  },
  {
    id: "adv_pine", name: "Pinecrest Travel", website: "https://example.com/pine", notes: "", status: "active",
    contacts: [contact("c5", "Ava Lindqvist", "Marketing", "ava@pine.example")], createdAt: iso(-30), activity: [act("Created advertiser", 30)],
  },
]

const eng = (i: number, c: number, v: number) => ({ impressions: i, clicks: c, completions: v })
export const seedCampaigns: Campaign[] = [
  {
    id: "cmp_lumen_spring", advertiserId: "adv_lumen", name: "Lumen: Night Shift sponsorship spot", headline: "Walk through the night.", objective: "Brand awareness among drama viewers.",
    contentIds: ["shw_nightshift"], sectionIds: [], creativeIds: ["med_img_citywide"], startDate: dateOnly(-10), endDate: dateOnly(20), status: "active",
    review: { decision: "approved", reason: "Copy and creative meet placement guidelines.", by: "Jordan Rivera", at: iso(-14) }, engagement: eng(48210, 1320, 902), createdAt: iso(-20),
    activity: [act("Activated", 10), act("Approved", 14, "Jordan Rivera", "Copy and creative meet placement guidelines."), act("Submitted for review", 15), act("Created draft", 20)],
  },
  {
    id: "cmp_pine_summer", advertiserId: "adv_pine", name: "Pinecrest: Harbor Lights feature", headline: "Your next escape starts here.", objective: "Promote the new travel feature.",
    contentIds: ["shw_harbor"], sectionIds: [], creativeIds: [], startDate: dateOnly(5), endDate: dateOnly(35), status: "in_review", engagement: eng(0, 0, 0), createdAt: iso(-6),
    activity: [act("Submitted for review", 2), act("Created draft", 6)],
  },
  {
    id: "cmp_lumen_old", advertiserId: "adv_lumen", name: "Lumen: Golden Hour premiere", headline: "Step into the glow.", objective: "Premiere awareness.",
    contentIds: ["mov_goldenhour"], sectionIds: [], creativeIds: ["med_img_golden"], startDate: dateOnly(-60), endDate: dateOnly(-30), status: "completed",
    review: { decision: "approved", reason: "Approved.", by: "Priya Nair", at: iso(-65) }, engagement: eng(91450, 2210, 1678), createdAt: iso(-70),
    activity: [act("Marked completed", 30), act("Activated", 60), act("Approved", 65, "Priya Nair", "Approved.")],
  },
  {
    id: "cmp_pine_rej", advertiserId: "adv_pine", name: "Pinecrest: Static banner test", headline: "Best deals anywhere!!!", objective: "Test a banner.",
    contentIds: ["mov_lastbroadcast"], sectionIds: [], creativeIds: ["med_img_archive"], startDate: dateOnly(-5), endDate: dateOnly(10), status: "rejected",
    review: { decision: "rejected", reason: "Headline makes unsupported claims. Revise the copy and resubmit.", by: "Priya Nair", at: iso(-3) }, engagement: eng(0, 0, 0), createdAt: iso(-12),
    activity: [act("Rejected", 3, "Priya Nair", "Headline makes unsupported claims. Revise the copy and resubmit."), act("Submitted for review", 4), act("Created draft", 12)],
  },
]

export const seedEvents: OpsEvent[] = [
  {
    id: "evt_ops_rooftop", title: "MGTV Live: Rooftop Sessions", description: "An evening of live performances streamed from the studio rooftop.", format: "hybrid",
    venue: "MGTV Studio Rooftop, 14 Harbor Street", onlineUrl: "https://example.com/live/rooftop", timezone: "America/New_York", start: dl(14), end: dl(14, 22),
    lifecycle: "scheduled", broadcast: "scheduled", posterId: "med_img_concert", trailerId: null, replayId: null, ticketUrl: "https://example.com/tickets/rooftop", createdAt: iso(-20),
    activity: [act("Broadcast scheduled", 5), act("Scheduled event", 10), act("Created draft", 20)],
  },
  {
    id: "evt_ops_awards", title: "MGTV Awards Ceremony", description: "Annual awards ceremony.", format: "in_person", venue: "Grand Hall, Union Square", onlineUrl: "",
    timezone: "America/Chicago", start: dl(40), end: dl(40, 22), lifecycle: "draft", broadcast: "not_configured", posterId: null, trailerId: null, replayId: null, ticketUrl: "", createdAt: iso(-8),
    activity: [act("Created draft", 8)],
  },
  {
    id: "evt_ops_qa", title: "Writers' Room: Night Shift Q&A", description: "Online conversation with the writers.", format: "online", venue: "", onlineUrl: "https://example.com/live/qa",
    timezone: "Europe/London", start: dl(-12, 18), end: dl(-12, 19), lifecycle: "completed", broadcast: "replay_available", posterId: "med_img_nightshift", trailerId: null, replayId: "med_vid_ns102",
    ticketUrl: "", createdAt: iso(-40), activity: [act("Replay linked", 11), act("Marked completed", 12), act("Created draft", 40)],
  },
]

const mkNominees = (prefix: string, names: string[]) => names.map((name, i) => ({ id: `${prefix}${i}`, name, note: "", imageId: null, contentId: null as string | null }))
export const seedAwards: Award[] = [
  {
    id: "awd_2026", name: "MGTV Awards 2026", year: 2026, votingOpens: dl(20, 9), votingCloses: dl(34, 18), voting: "not_open", results: "hidden", createdAt: iso(-30),
    categories: [
      { id: "cat_series", name: "Series of the Year", archived: false, nominees: [{ id: "n1", name: "Night Shift", note: "", imageId: "med_img_nightshift", contentId: "shw_nightshift" }, { id: "n2", name: "Harbor Lights", note: "", imageId: "med_img_harbor", contentId: "shw_harbor" }, { id: "n3", name: "Static Dreams", note: "", imageId: null, contentId: null }] },
      { id: "cat_film", name: "Feature Film", archived: false, nominees: [{ id: "n4", name: "The Last Broadcast", note: "", imageId: "med_img_broadcast", contentId: "mov_lastbroadcast" }, { id: "n5", name: "Golden Hour", note: "", imageId: "med_img_golden_poster", contentId: "mov_goldenhour" }] },
      { id: "cat_music", name: "Music Video", archived: false, nominees: mkNominees("m", ["Neon Static"]) },
    ],
    activity: [act("Added category Music Video", 6), act("Created award program", 30)],
  },
]

export const seedReports: Report[] = [
  { id: "rpt_1", type: "Comment", priority: "high", targetKey: "cm_44120", targetTitle: "Comment on Night Shift S01E02", targetSnippet: "\"You people who like this show are all idiots and should be banned from the site.\"", targetAuthor: "user_88213", contentId: "shw_nightshift", reporter: "viewer_4410", category: "Harassment", detail: "Directed insults at other commenters.", createdAt: iso(-1), status: "open", targetRemoved: false, activity: [act("Report received", 1, "System")] },
  { id: "rpt_2", type: "Comment", priority: "high", targetKey: "cm_44120", targetTitle: "Comment on Night Shift S01E02", targetSnippet: "\"You people who like this show are all idiots and should be banned from the site.\"", targetAuthor: "user_88213", contentId: "shw_nightshift", reporter: "viewer_9021", category: "Hate or abuse", detail: "", createdAt: iso(-0.5), status: "open", targetRemoved: false, activity: [act("Report received", 0, "System")] },
  { id: "rpt_3", type: "Video", priority: "medium", targetKey: "mvd_neonstatic", targetTitle: "Neon Static (music video)", targetSnippet: "Reporter says strobing visuals appear without a warning.", targetAuthor: "MGTV catalogue", contentId: "mvd_neonstatic", reporter: "viewer_1190", category: "Missing content warning", detail: "Strobe effects at 1:20 without any notice.", createdAt: iso(-2), status: "open", targetRemoved: false, activity: [act("Report received", 2, "System")] },
  { id: "rpt_4", type: "Profile", priority: "low", targetKey: "pf_5521", targetTitle: "Profile: sunny_deals_now", targetSnippet: "Bio contains a link to an unrelated shopping site.", targetAuthor: "sunny_deals_now", contentId: null, reporter: "viewer_7731", category: "Spam", detail: "", createdAt: iso(-3), status: "open", targetRemoved: false, activity: [act("Report received", 3, "System")] },
  { id: "rpt_5", type: "Review", priority: "medium", targetKey: "rv_3310", targetTitle: "Review of The Last Broadcast", targetSnippet: "\"Spoiler: the narrator turns out to be the station owner.\"", targetAuthor: "user_20440", contentId: null, reporter: "viewer_5502", category: "Spoilers", detail: "Spoiler posted without a warning label.", createdAt: iso(-6), status: "resolved", outcome: "dismissed", outcomeReason: "Reviews may contain spoilers if labelled. This one is labelled.", resolvedAt: iso(-5), targetRemoved: false, activity: [act("Dismissed report", 5, "Priya Nair", "Reviews may contain spoilers if labelled. This one is labelled."), act("Report received", 6, "System")] },
]

export const seedNotifications: Notification[] = [
  { id: "ntf_1", title: "Rooftop Sessions goes live in two weeks", body: "Save the date. Watch the live stream with us.", channels: ["push", "in_app"], audienceId: "events", scheduleAt: "", status: "sent", sentAt: iso(-4), result: { delivered: 6590, opened: 2210, failed: 190 }, createdAt: iso(-5), activity: [act("Simulated send completed", 4), act("Created draft", 5)] },
  { id: "ntf_2", title: "New this week on MGTV", body: "Night Shift Season 2 is now streaming.", channels: ["email"], audienceId: "all", scheduleAt: dl(3, 10), status: "scheduled", createdAt: iso(-1), activity: [act("Scheduled (simulation)", 1), act("Created draft", 1)] },
  { id: "ntf_3", title: "We miss you", body: "Pick up where you left off.", channels: ["email", "push"], audienceId: "lapsed", scheduleAt: "", status: "draft", createdAt: iso(-1), activity: [act("Created draft", 1)] },
]

export const seedTemplates: Template[] = [
  { id: "tpl_1", name: "Event reminder", title: "{{event}} starts soon", body: "Join us {{when}}. Tap to open the event.", channels: ["push", "in_app"] },
  { id: "tpl_2", name: "New release", title: "New on MGTV: {{title}}", body: "{{title}} is now streaming.", channels: ["email", "push"] },
]

export const seedUsers: AdminUser[] = [
  { id: "usr_1", name: "Jordan Rivera", email: "jordan.rivera@mgtv.example", role: "Admin", status: "active", lastActive: iso(0), activity: [act("Account created", 200, "System")] },
  { id: "usr_2", name: "Priya Nair", email: "priya.nair@mgtv.example", role: "Moderator", status: "active", lastActive: iso(-0.2), activity: [act("Role changed from Viewer to Moderator", 40, "Jordan Rivera")] },
  { id: "usr_3", name: "Sam Okoye", email: "sam.okoye@mgtv.example", role: "Editor", status: "active", lastActive: iso(-1), activity: [act("Account created", 120, "System")] },
  { id: "usr_4", name: "Casey Brandt", email: "casey.brandt@mgtv.example", role: "Viewer", status: "invited", lastActive: "", activity: [act("Invitation sent", 2, "Jordan Rivera")] },
  { id: "usr_5", name: "Morgan Hale", email: "morgan.hale@mgtv.example", role: "Editor", status: "suspended", lastActive: iso(-30), activity: [act("Suspended", 9, "Jordan Rivera", "Left the team; access removed pending offboarding.")] },
]

export const seedSettings: Settings = {
  orgName: "MGTV", supportEmail: "support@mgtv.example", defaultLanguage: "English", defaultTimezone: "America/New_York",
  alertReports: true, alertCampaignReview: true, weeklyDigest: false, updatedAt: iso(-20),
}
