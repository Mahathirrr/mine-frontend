"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import type { EnglishOverview } from "@/lib/api/english";

import { daysUntil, formatIeltsBand, formatToeflScore, sectionBarData, sectionLabel } from "./english-utils";

const practiceConfig = {
  minutes: { label: "Menit", color: "var(--chart-1)" },
} satisfies ChartConfig;

const scoreConfig = {
  overall: { label: "Skor", color: "var(--chart-2)" },
} satisfies ChartConfig;

function insightClass(tone: string) {
  if (tone === "warning") return "border-amber-500/30 bg-amber-500/5";
  if (tone === "success") return "border-emerald-500/30 bg-emerald-500/5";
  return "border-sky-500/30 bg-sky-500/5";
}

type Props = { data: EnglishOverview };

export function EnglishOverviewPanel({ data }: Props) {
  const { profile, stats, section_averages, score_timeline, practice_chart, insights, recommended_focus } = data;
  const toeflDays = daysUntil(profile.toefl_exam_date);
  const ieltsDays = daysUntil(profile.ielts_exam_date);

  const toeflBars = sectionBarData(section_averages.toefl ?? [], "toefl");
  const ieltsBars = sectionBarData(section_averages.ielts ?? [], "ielts");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>TOEFL iBT terakhir</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatToeflScore(stats.latest_toefl)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Target</span>
              <span>{profile.toefl_target_total}</span>
            </div>
            <Progress value={stats.readiness_toefl} />
            <p className="text-muted-foreground text-xs">Kesiapan {stats.readiness_toefl}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>IELTS band terakhir</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatIeltsBand(stats.latest_ielts)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Target</span>
              <span>{profile.ielts_target_band.toFixed(1)}</span>
            </div>
            <Progress value={stats.readiness_ielts} />
            <p className="text-muted-foreground text-xs">Kesiapan {stats.readiness_ielts}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Belajar minggu ini</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stats.practice_hours_week.toFixed(1)} jam</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {stats.practice_sessions_week} sesi · target {profile.weekly_hours_goal} jam/minggu
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Streak & vocab</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{profile.study_streak} hari</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {stats.vocab_total} kata · {stats.mock_total} mock test tercatat
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Countdown ujian</CardTitle>
            <CardDescription>Tanggal target dari profil belajar</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="font-medium text-sm">TOEFL iBT</p>
              <p className="mt-1 font-semibold text-2xl tabular-nums">
                {toeflDays == null
                  ? "Belum di-set"
                  : toeflDays > 0
                    ? `${toeflDays} hari`
                    : toeflDays === 0
                      ? "Hari ini"
                      : "Lewat"}
              </p>
              <p className="text-muted-foreground text-xs">{profile.toefl_exam_date ?? "Tambah di tab Profil"}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium text-sm">IELTS</p>
              <p className="mt-1 font-semibold text-2xl tabular-nums">
                {ieltsDays == null
                  ? "Belum di-set"
                  : ieltsDays > 0
                    ? `${ieltsDays} hari`
                    : ieltsDays === 0
                      ? "Hari ini"
                      : "Lewat"}
              </p>
              <p className="text-muted-foreground text-xs">{profile.ielts_exam_date ?? "Tambah di tab Profil"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fokus rekomendasi</CardTitle>
            <CardDescription>Berdasarkan rata-rata section mock full test</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline">
              TOEFL: {sectionLabel[recommended_focus.toefl_section] ?? recommended_focus.toefl_section}
            </Badge>
            <Badge variant="outline">
              IELTS: {sectionLabel[recommended_focus.ielts_section] ?? recommended_focus.ielts_section}
            </Badge>
            <Badge variant="secondary">CEFR {profile.current_cefr}</Badge>
          </CardContent>
        </Card>
      </div>

      {insights.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((ins, i) => (
            <div key={i} className={`rounded-lg border p-4 ${insightClass(ins.tone)}`}>
              <p className="font-medium">{ins.title}</p>
              <p className="mt-1 text-muted-foreground text-sm">{ins.detail}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Timeline skor mock</CardTitle>
            <CardDescription>Perkembangan overall TOEFL & IELTS</CardDescription>
          </CardHeader>
          <CardContent>
            {score_timeline.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada mock test. Catat di tab Mock Test.</p>
            ) : (
              <ChartContainer config={scoreConfig} className="h-56 w-full">
                <LineChart data={score_timeline}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
                  <YAxis width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="overall" stroke="var(--color-overall)" strokeWidth={2} dot />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Menit latihan (14 hari)</CardTitle>
            <CardDescription>Volume harian dari log practice</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={practiceConfig} className="h-56 w-full">
              <BarChart data={practice_chart}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(8)} />
                <YAxis width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="minutes" fill="var(--color-minutes)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionAvgCard title="Rata-rata section TOEFL" exam="toefl" bars={toeflBars} />
        <SectionAvgCard title="Rata-rata section IELTS" exam="ielts" bars={ieltsBars} />
      </div>
    </div>
  );
}

function SectionAvgCard({
  title,
  exam,
  bars,
}: {
  title: string;
  exam: string;
  bars: { section: string; score: number; max: number }[];
}) {
  const cfg = Object.fromEntries(
    bars.map((b) => [b.section.toLowerCase(), { label: b.section, color: "var(--chart-3)" }]),
  ) satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Dari mock full test (max {exam === "ielts" ? "9.0" : "30"})</CardDescription>
      </CardHeader>
      <CardContent>
        {bars.length === 0 ? (
          <p className="text-muted-foreground text-sm">Butuh minimal 1 mock full test.</p>
        ) : (
          <ChartContainer config={cfg} className="h-52 w-full">
            <BarChart data={bars} layout="vertical">
              <CartesianGrid horizontal={false} />
              <XAxis type="number" domain={[0, exam === "ielts" ? 9 : 30]} />
              <YAxis type="category" dataKey="section" width={72} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="score" fill="var(--chart-3)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
