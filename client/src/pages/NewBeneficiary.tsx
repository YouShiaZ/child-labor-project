// Child Labor Project — New Entry: full beneficiary intake form (all sections).
import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  createBeneficiary,
  getCurrentProject,
  computeAge,
  nextBeneficiaryNumber,
  fileToDataUrl,
} from "@/lib/api";
import { SectionCard } from "@/components/ui-bits";
import MultiSelect from "@/components/MultiSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  HOBBY_OPTIONS,
  FAVORITE_COLOR_OPTIONS,
  CHARACTER_OPTIONS,
  LANGUAGE_OPTIONS,
  SCHOOL_LEVEL_OPTIONS,
  FAVORITE_SUBJECT_OPTIONS,
} from "@/lib/options";
import { toast } from "sonner";
import {
  User as UserIcon,
  HeartPulse,
  Smile,
  Users,
  GraduationCap,
  ChevronLeft,
  Upload,
} from "lucide-react";
import type {
  Gender,
  HealthSituation,
  ParentsAlive,
  LiveWith,
  HouseType,
  SchoolPerformance,
} from "@/lib/types";

function Pair({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export default function NewBeneficiary() {
  const [, navigate] = useLocation();
  const project = getCurrentProject();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [photoUrl, setPhotoUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [village, setVillage] = useState("");

  const [healthSituation, setHealthSituation] = useState<HealthSituation>("good");

  const [hobbies, setHobbies] = useState<string[]>([]);
  const [favoriteColor, setFavoriteColor] = useState("");
  const [character, setCharacter] = useState<string[]>([]);

  const [parentsAlive, setParentsAlive] = useState<ParentsAlive>("both");
  const [liveWithBothParents, setLiveWithBothParents] = useState(true);
  const [liveWith, setLiveWith] = useState<LiveWith>("both");
  const [hasSiblings, setHasSiblings] = useState(false);
  const [siblingsCount, setSiblingsCount] = useState("");
  const [typeOfHouse, setTypeOfHouse] = useState<HouseType>("mud_brick");

  const [schoolLevel, setSchoolLevel] = useState("");
  const [schoolPerformance, setSchoolPerformance] = useState<SchoolPerformance>("good");
  const [favoriteSubject, setFavoriteSubject] = useState("");
  const [futurePlans, setFuturePlans] = useState("");

  const age = computeAge(dateOfBirth);

  if (!project) {
    return <div className="py-24 text-center text-muted-foreground">Project not found.</div>;
  }

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoUrl(await fileToDataUrl(file));
    } catch {
      toast.error("Could not read that image.");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !dateOfBirth) {
      toast.error("Please fill in first name, last name and date of birth.");
      return;
    }
    const created = createBeneficiary({
      projectId: project.id,
      beneficiaryNumber: nextBeneficiaryNumber(),
      status: "entry",
      firstName,
      lastName,
      dateOfBirth,
      gender,
      photoUrl: photoUrl || undefined,
      language,
      village,
      healthSituation,
      hobbies,
      favoriteColor,
      character,
      parentsAlive,
      liveWithBothParents,
      liveWith: liveWithBothParents ? "both" : liveWith,
      hasSiblings,
      siblingsCount: hasSiblings ? Number(siblingsCount) || 0 : undefined,
      typeOfHouse,
      schoolLevel,
      schoolPerformance,
      favoriteSubject,
      futurePlans,
    });
    toast.success("Beneficiary created.");
    navigate(`/beneficiaries/${created.id}`);
  };

  return (
    <div className="space-y-6">
      <Link href="/project" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Back to {project.projectName}
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold text-primary">New Entry</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register a new beneficiary in {project.projectName}.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* General */}
        <SectionCard title="General Information" icon={<UserIcon className="h-4 w-4" />}>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <Pair>
                <div className="space-y-2">
                  <Label>First name *</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last name *</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </Pair>
              <Pair>
                <div className="space-y-2">
                  <Label>Date of birth *</Label>
                  <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Age (auto)</Label>
                  <Input value={age !== null ? `${age} years` : ""} disabled placeholder="—" />
                </div>
              </Pair>
              <Pair>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </Pair>
              <div className="space-y-2">
                <Label>Village</Label>
                <Input value={village} onChange={(e) => setVillage(e.target.value)} />
              </div>
            </div>

            {/* Photo */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/40">
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-7 w-7" />
                    <span className="text-xs">No photo</span>
                  </div>
                )}
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-primary hover:bg-muted/40">
                <Upload className="h-4 w-4" /> Upload photo
                <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              </label>
            </div>
          </div>
        </SectionCard>

        {/* Health */}
        <SectionCard title="Health Situation" icon={<HeartPulse className="h-4 w-4" />}>
          <RadioGroup
            value={healthSituation}
            onValueChange={(v) => setHealthSituation(v as HealthSituation)}
            className="flex flex-wrap gap-6"
          >
            {(["good", "average", "poor"] as const).map((h) => (
              <div key={h} className="flex items-center gap-2">
                <RadioGroupItem value={h} id={`health-${h}`} />
                <Label htmlFor={`health-${h}`} className="capitalize">{h}</Label>
              </div>
            ))}
          </RadioGroup>
        </SectionCard>

        {/* Social */}
        <SectionCard title="Social Issues" icon={<Smile className="h-4 w-4" />}>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Hobbies</Label>
              <MultiSelect options={HOBBY_OPTIONS} value={hobbies} onChange={setHobbies} />
            </div>
            <Pair>
              <div className="space-y-2">
                <Label>Favorite color</Label>
                <Select value={favoriteColor} onValueChange={setFavoriteColor}>
                  <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                  <SelectContent>
                    {FAVORITE_COLOR_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Pair>
            <div className="space-y-2">
              <Label>Character of beneficiary</Label>
              <MultiSelect options={CHARACTER_OPTIONS} value={character} onChange={setCharacter} />
            </div>
          </div>
        </SectionCard>

        {/* Family */}
        <SectionCard title="Family Situation" icon={<Users className="h-4 w-4" />}>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Parents alive</Label>
              <RadioGroup
                value={parentsAlive}
                onValueChange={(v) => setParentsAlive(v as ParentsAlive)}
                className="flex flex-wrap gap-6"
              >
                <div className="flex items-center gap-2"><RadioGroupItem value="both" id="pa-both" /><Label htmlFor="pa-both">Both alive</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="father" id="pa-father" /><Label htmlFor="pa-father">Father alive</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="mother" id="pa-mother" /><Label htmlFor="pa-mother">Mother alive</Label></div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Lives with both parents?</Label>
              <RadioGroup
                value={liveWithBothParents ? "yes" : "no"}
                onValueChange={(v) => setLiveWithBothParents(v === "yes")}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="lw-yes" /><Label htmlFor="lw-yes">Yes</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="no" id="lw-no" /><Label htmlFor="lw-no">No</Label></div>
              </RadioGroup>
            </div>

            {!liveWithBothParents && (
              <div className="space-y-2">
                <Label>If not, lives with</Label>
                <RadioGroup
                  value={liveWith}
                  onValueChange={(v) => setLiveWith(v as LiveWith)}
                  className="flex flex-wrap gap-6"
                >
                  <div className="flex items-center gap-2"><RadioGroupItem value="father" id="lwt-father" /><Label htmlFor="lwt-father">With father</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="mother" id="lwt-mother" /><Label htmlFor="lwt-mother">With mother</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="others" id="lwt-others" /><Label htmlFor="lwt-others">With others</Label></div>
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label>Siblings?</Label>
              <div className="flex items-center gap-6">
                <RadioGroup
                  value={hasSiblings ? "yes" : "no"}
                  onValueChange={(v) => setHasSiblings(v === "yes")}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="sb-yes" /><Label htmlFor="sb-yes">Yes</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="no" id="sb-no" /><Label htmlFor="sb-no">No</Label></div>
                </RadioGroup>
                {hasSiblings && (
                  <Input
                    type="number"
                    min={0}
                    placeholder="Number"
                    value={siblingsCount}
                    onChange={(e) => setSiblingsCount(e.target.value)}
                    className="h-9 w-28"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type of house</Label>
              <RadioGroup
                value={typeOfHouse}
                onValueChange={(v) => setTypeOfHouse(v as HouseType)}
                className="flex flex-wrap gap-6"
              >
                <div className="flex items-center gap-2"><RadioGroupItem value="mud_brick" id="h-mud" /><Label htmlFor="h-mud">Mud brick</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="reinforced_concrete" id="h-rc" /><Label htmlFor="h-rc">Reinforced concrete</Label></div>
              </RadioGroup>
            </div>
          </div>
        </SectionCard>

        {/* Education */}
        <SectionCard title="Child Education" icon={<GraduationCap className="h-4 w-4" />}>
          <div className="space-y-5">
            <Pair>
              <div className="space-y-2">
                <Label>School level</Label>
                <Select value={schoolLevel} onValueChange={setSchoolLevel}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {SCHOOL_LEVEL_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>School performance</Label>
                <Select value={schoolPerformance} onValueChange={(v) => setSchoolPerformance(v as SchoolPerformance)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="weak">Weak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Pair>
            <div className="space-y-2">
              <Label>Favorite subject</Label>
              <Select value={favoriteSubject} onValueChange={setFavoriteSubject}>
                <SelectTrigger className="sm:max-w-xs"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {FAVORITE_SUBJECT_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Future plans</Label>
              <Textarea value={futurePlans} onChange={(e) => setFuturePlans(e.target.value)} rows={3} placeholder="What does the child hope to become?" />
            </div>
          </div>
        </SectionCard>

        <div className="flex items-center justify-end gap-3">
          <Link href="/project">
            <Button type="button" variant="outline" className="bg-card">Cancel</Button>
          </Link>
          <Button type="submit" size="lg">Create Beneficiary</Button>
        </div>
      </form>
    </div>
  );
}
